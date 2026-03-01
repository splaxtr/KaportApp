import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, handleApiError } from "@/lib/http";
import { createToken } from "@/lib/auth";
import { withLoginRateLimit } from "@/lib/api-guard";
import { loginSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { getRedis } from "@/lib/redis";

function getClientIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function loginHandler(req: NextRequest) {
  const ip = getClientIP(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json().catch(() => ({}));

    // Zod validation
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      return badRequest(validation.error);
    }

    const { email, password } = validation.data;

    // Hesap kilitleme kontrolü (Redis-based)
    const lockoutKey = `lockout:${email}`;
    const attemptsKey = `login_attempts:${email}`;
    const redis = await getRedis();

    if (redis) {
      const locked = await redis.get(lockoutKey);
      if (locked) {
        return NextResponse.json(
          { error: "Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin." },
          { status: 429 }
        );
      }
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      // Timing attack önleme
      await bcrypt.compare(password, "$2a$12$placeholder.hash.for.timing");
      // Başarısız deneme sayacı
      if (redis) {
        const attempts = await redis.incr(attemptsKey);
        if (attempts === 1) await redis.expire(attemptsKey, 900);
        if (attempts >= 5) {
          await redis.set(lockoutKey, "1", { EX: 900 });
          await redis.del(attemptsKey);
        }
      }
      logger.auth("failed", email, { ip, userAgent, reason: "user_not_found" });
      return badRequest("Geçersiz e-posta veya şifre.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Başarısız deneme sayacı
      if (redis) {
        const attempts = await redis.incr(attemptsKey);
        if (attempts === 1) await redis.expire(attemptsKey, 900);
        if (attempts >= 5) {
          await redis.set(lockoutKey, "1", { EX: 900 });
          await redis.del(attemptsKey);
          logger.warn("Account locked due to failed attempts", { email, ip });
        }
      }
      logger.auth("failed", email, { ip, userAgent, reason: "wrong_password" });
      return badRequest("Geçersiz e-posta veya şifre.");
    }

    // Başarılı giriş - sayacı sıfırla
    if (redis) {
      await redis.del(attemptsKey);
      await redis.del(lockoutKey);
    }

    // JWT token oluştur
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role.key,
      fullName: user.fullName,
    });

    logger.auth("login", email, { ip, userAgent, userId: user.id });

    // Token'ı sadece httpOnly cookie olarak ayarla, response body'de döndürme
    const response = NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.key,
    });

    response.cookies.set("kaporta_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 saat
    });

    return response;
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), {
      path: "/api/auth/login",
      method: "POST",
      ip,
      userAgent,
    });
  }
}

export const POST = withLoginRateLimit(loginHandler);
