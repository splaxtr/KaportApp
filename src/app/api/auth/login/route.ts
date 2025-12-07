import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return badRequest("E-posta ve şifre gereklidir.");
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      return notFound("Kullanıcı bulunamadı.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return badRequest("Geçersiz e-posta veya şifre.");
    }

    // TODO: Session/JWT entegrasyonu burada yapılacak.
    return json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.key,
    });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
