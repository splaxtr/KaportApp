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

async function ensureStatus(label?: string | null) {
  if (!label) return null;
  const existing = await prisma.partStatus.findFirst({ where: { label: label.trim() } });
  if (existing) return existing.id;
  const created = await prisma.partStatus.create({ data: { label: label.trim() } });
  return created.id;
}

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const partId = parseId(id);
    if (!partId) return badRequest("Geçersiz parça id");

    const part = await prisma.part.findFirst({ where: { id: partId, deletedAt: null } });
    if (!part) return notFound();

    const body = await req.json().catch(() => ({}));
    const data: { name?: string; quantity?: number; statusId?: number } = {};

    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.quantity === "number" && body.quantity > 0) data.quantity = body.quantity;

    if (body?.status) {
      const statusId = await ensureStatus(body.status);
      if (statusId) data.statusId = statusId;
    }

    const updated = await prisma.part.update({
      where: { id: partId },
      data,
      include: { status: true },
    });

    return json({
      id: updated.id,
      name: updated.name,
      quantity: updated.quantity,
      status: updated.status?.label ?? "",
    });
  } catch (error) {
    logger.error("Part update error", error as Error, { path: "/api/parts/[id]", method: "PATCH" });
    return serverError();
  }
}, { requiredPermissions: ["parts.manage"] });

export const DELETE = withAuth<Params>(async (req: NextRequest, { params, user }) => {
  try {
    const { id } = await params;
    const partId = parseId(id);
    if (!partId) return badRequest("Geçersiz parça id");

    const part = await prisma.part.findFirst({ where: { id: partId, deletedAt: null } });
    if (!part) return notFound();

    await prisma.part.update({ where: { id: partId }, data: { deletedAt: new Date() } });

    logger.audit("delete", "part", getAuditContext(req, user, { targetId: partId }));

    return json({ ok: true });
  } catch (error) {
    logger.error("Part delete error", error as Error, { path: "/api/parts/[id]", method: "DELETE" });
    return serverError();
  }
}, { requiredPermissions: ["parts.manage"] });
