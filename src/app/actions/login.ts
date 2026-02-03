// Server Action for login
"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { setAuthCookie } from "@/lib/auth";

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
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      // Timing attack önleme - her durumda aynı süre bekle
      await bcrypt.compare(password, "$2a$12$placeholder.hash.for.timing");
      return { success: false, error: "Geçersiz e-posta veya şifre." };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return { success: false, error: "Geçersiz e-posta veya şifre." };
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error:", error.code);
    } else {
      console.error("Login error:", error);
    }
    return { success: false, error: "Beklenmedik hata oluştu." };
  }
}
