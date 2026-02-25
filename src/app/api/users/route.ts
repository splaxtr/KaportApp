import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { createUserSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";

// GET - Kullanıcı listesi (sadece admin)
export const GET = withAuth(
  async () => {
    try {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        include: { role: true },
        orderBy: { createdAt: "desc" },
      });

      return json(
        users.map((user: { id: number; fullName: string; email: string; phone: string | null; role: { key: string }; createdAt: Date }) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role.key,
          createdAt: user.createdAt,
        }))
      );
    } catch (error) {
      logger.error("User list error", error as Error, { path: "/api/users", method: "GET" });
      return serverError();
    }
  },
  { requireAdmin: true, requiredPermissions: ["users.manage"] }
);

// POST - Yeni kullanıcı oluştur (sadece admin)
export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      const body = await req.json().catch(() => ({}));

      // Zod validation
      const validation = validate(createUserSchema, body);
      if (!validation.success) {
        return badRequest(validation.error);
      }

      const { fullName, email, password, phone, roleKey } = validation.data;

      const role = await prisma.role.findUnique({ where: { key: roleKey } });
      if (!role) {
        return badRequest("Geçersiz rol.");
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
          phone: phone ?? null,
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
        { status: 201 }
      );
    } catch (error) {
      logger.error("User create error", error as Error, { path: "/api/users", method: "POST" });
      return serverError();
    }
  },
  { requireAdmin: true, requiredPermissions: ["users.manage"] }
);
