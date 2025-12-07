import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { RoleKey } from "@prisma/client";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });

    return json(
      users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role.key,
        createdAt: user.createdAt,
      })),
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const roleKey = body?.roleKey as RoleKey | undefined;

    if (!fullName || !email || !password || !roleKey) {
      return badRequest("fullName, email, password ve roleKey gereklidir.");
    }

    const role = await prisma.role.findUnique({ where: { key: roleKey } });
    if (!role) {
      return badRequest("Geçersiz roleKey.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest("Bu e-posta ile kayıt mevcut.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        roleId: role.id,
        passwordHash,
      },
      include: { role: true },
    });

    return json(
      {
        id: created.id,
        fullName: created.fullName,
        email: created.email,
        phone: created.phone,
        role: created.role.key,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
