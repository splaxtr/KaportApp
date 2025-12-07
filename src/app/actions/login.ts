// Server Action for login
"use server";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

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
      return { success: false, error: "Geçersiz e-posta veya şifre." };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return { success: false, error: "Geçersiz e-posta veya şifre." };
    }

    // Basit (demo) cookie: gerçek projede HttpOnly, imzalı/JWT session kullanılmalı.
    const cookieStore = await cookies();
    cookieStore.set("kaporta_auth", JSON.stringify({ id: user.id, role: user.role.key }), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 saat
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error);
    } else {
      console.error(error);
    }
    return { success: false, error: "Beklenmedik hata oluştu." };
  }
}
