import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { createToken } from "@/lib/auth";
import { withLoginRateLimit } from "@/lib/api-guard";
import { loginSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";

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

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      // Timing attack önleme
      await bcrypt.compare(password, "$2a$12$placeholder.hash.for.timing");
      logger.auth("failed", email, { ip, userAgent, reason: "user_not_found" });
      return badRequest("Geçersiz e-posta veya şifre.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      logger.auth("failed", email, { ip, userAgent, reason: "wrong_password" });
      return badRequest("Geçersiz e-posta veya şifre.");
    }

    // JWT token oluştur
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role.key,
      fullName: user.fullName,
    });

    logger.auth("login", email, { ip, userAgent, userId: user.id });

    return json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.key,
      token,
    });
  } catch (error) {
    logger.error("Login API error", error as Error, { ip, userAgent });
    return serverError();
  }
}

export const POST = withLoginRateLimit(loginHandler);
