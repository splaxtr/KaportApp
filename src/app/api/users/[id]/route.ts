import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";
import { getAuditContext } from "@/lib/audit";

type Params = { id: string };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// DELETE - Kullanıcı sil (sadece admin)
export const DELETE = withAuth<Params>(
  async (req, { params, user }) => {
    try {
      const { id } = await params;
      const userId = parseId(id);
      if (!userId) return badRequest("Geçersiz kullanıcı id");

      const existing = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
      if (!existing) return notFound();

      const now = new Date();

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { deletedAt: now } }),
        prisma.photo.updateMany({
          where: { uploadedById: userId, deletedAt: null },
          data: { uploadedById: null },
        }),
      ]);

      logger.audit("delete", "user", getAuditContext(req, user, { targetId: userId }));

      return json({ ok: true });
    } catch (error) {
      logger.error("User delete error", error as Error, { path: "/api/users/[id]", method: "DELETE" });
      return serverError();
    }
  },
  { requireAdmin: true, requiredPermissions: ["users.manage"] }
);

// PATCH - Kullanıcı güncelle (sadece admin)
export const PATCH = withAuth<Params>(
  async (req: NextRequest, { params }) => {
    try {
      const { id } = await params;
      const userId = parseId(id);
      if (!userId) return badRequest("Geçersiz kullanıcı id");

      const existing = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
      if (!existing) return notFound();

      const body = await req.json().catch(() => ({}));
      const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : undefined;
      const phone = typeof body?.phone === "string" ? body.phone.trim() : undefined;
      const roleKey = body?.roleKey as string | undefined;

      const data: { fullName?: string; phone?: string | null; roleId?: number } = {};
      if (fullName !== undefined) data.fullName = fullName || existing.fullName;
      if (phone !== undefined) data.phone = phone || null;
      if (roleKey) {
        const role = await prisma.role.findUnique({ where: { key: roleKey } });
        if (!role) return badRequest("Geçersiz rol");
        data.roleId = role.id;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data,
        include: { role: true },
      });

      return json({
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        role: updated.role.key,
        createdAt: updated.createdAt,
      });
    } catch (error) {
      logger.error("User update error", error as Error, { path: "/api/users/[id]", method: "PATCH" });
      return serverError();
    }
  },
  { requireAdmin: true, requiredPermissions: ["users.manage"] }
);
