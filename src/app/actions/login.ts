// Server Action for login
"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { setAuthCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getRedis } from "@/lib/redis";

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, error: "E-posta ve şifre gereklidir." };
  }

  try {
    // Hesap kilitleme kontrolü (Redis-based)
    const lockoutKey = `lockout:${email}`;
    const attemptsKey = `login_attempts:${email}`;
    const redis = await getRedis();

    if (redis) {
      const locked = await redis.get(lockoutKey);
      if (locked) {
        return { success: false, error: "Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin." };
      }
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      // Timing attack önleme - her durumda aynı süre bekle
      await bcrypt.compare(password, "$2a$12$placeholder.hash.for.timing");
      // Başarısız deneme sayacı
      if (redis) {
        const attempts = await redis.incr(attemptsKey);
        if (attempts === 1) await redis.expire(attemptsKey, 900);
        if (attempts >= 5) {
          await redis.set(lockoutKey, "1", { EX: 900 }); // 15 dakika kilitle
          await redis.del(attemptsKey);
        }
      }
      return { success: false, error: "Geçersiz e-posta veya şifre." };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Başarısız deneme sayacı
      if (redis) {
        const attempts = await redis.incr(attemptsKey);
        if (attempts === 1) await redis.expire(attemptsKey, 900);
        if (attempts >= 5) {
          await redis.set(lockoutKey, "1", { EX: 900 }); // 15 dakika kilitle
          await redis.del(attemptsKey);
          logger.warn("Account locked due to failed attempts", { email });
        }
      }
      return { success: false, error: "Geçersiz e-posta veya şifre." };
    }

    // Başarılı giriş - sayacı sıfırla
    if (redis) {
      await redis.del(attemptsKey);
      await redis.del(lockoutKey);
    }

    // JWT tabanlı güvenli cookie ayarla
    await setAuthCookie({
      id: user.id,
      email: user.email,
      role: user.role.key,
      fullName: user.fullName,
    });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    const errMsg = err.message || "";
    const errName = err.name || "";

    logger.error("Login action error", err, { path: "actions/login", email });

    // Kullanıcıya gösterilecek mesajı hata türüne göre belirle
    if (errName.includes("PrismaClient") || errMsg.includes("prisma")) {
      if (errMsg.includes("Authentication failed")) {
        return { success: false, error: "Veritabanı bağlantı hatası. Sistem yöneticisine başvurun." };
      }
      if (errMsg.includes("connect") || errMsg.includes("Connection") || errMsg.includes("timeout")) {
        return { success: false, error: "Veritabanına bağlanılamadı. Lütfen birkaç dakika sonra tekrar deneyin." };
      }
      return { success: false, error: "Veritabanı hatası oluştu. Lütfen tekrar deneyin." };
    }

    if (errMsg.includes("Redis") || errMsg.includes("redis") || errMsg.includes("ECONNREFUSED")) {
      return { success: false, error: "Oturum servisi geçici olarak kullanılamıyor. Lütfen tekrar deneyin." };
    }

    if (errMsg.includes("JWT") || errMsg.includes("jwt") || errMsg.includes("secret")) {
      return { success: false, error: "Oturum oluşturulurken hata oluştu. Sistem yöneticisine başvurun." };
    }

    return { success: false, error: "Beklenmedik hata oluştu. Lütfen tekrar deneyin." };
  }
}
