import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
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
  const existing = await prisma.operationStatus.findFirst({ where: { label: label.trim() } });
  if (existing) return existing.id;
  const created = await prisma.operationStatus.create({ data: { label: label.trim() } });
  return created.id;
}

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const opId = parseId(id);
    if (!opId) return badRequest("Geçersiz işlem id");

    const op = await prisma.operation.findFirst({ where: { id: opId, deletedAt: null } });
    if (!op) return notFound();

    const body = await req.json().catch(() => ({}));
    const data: { title?: string; description?: string | null; laborCost?: number | null; materialCost?: number | null; statusId?: number } = {};

    if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (body?.note !== undefined) data.description = typeof body.note === "string" ? body.note.trim() : null;
    if (body?.laborCost !== undefined) {
      const v = body.laborCost === null || body.laborCost === "" ? null : Number(body.laborCost);
      data.laborCost = v !== null && !isNaN(v) ? v : null;
    }
    if (body?.materialCost !== undefined) {
      const v = body.materialCost === null || body.materialCost === "" ? null : Number(body.materialCost);
      data.materialCost = v !== null && !isNaN(v) ? v : null;
    }

    if (body?.status) {
      const statusId = await ensureStatus(body.status);
      if (statusId) data.statusId = statusId;
    }

    const updated = await prisma.operation.update({
      where: { id: opId },
      data,
      include: { status: true },
    });

    return json({
      id: updated.id,
      title: updated.title,
      note: updated.description,
      laborCost: updated.laborCost ? Number(updated.laborCost) : null,
      materialCost: updated.materialCost ? Number(updated.materialCost) : null,
      status: updated.status?.label ?? "",
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/operations/[id]", method: "PATCH" });
  }
}, { requiredPermissions: ["operations.manage"] });

export const DELETE = withAuth<Params>(async (req: NextRequest, { params, user }) => {
  try {
    const { id } = await params;
    const opId = parseId(id);
    if (!opId) return badRequest("Geçersiz işlem id");

    const op = await prisma.operation.findFirst({ where: { id: opId, deletedAt: null } });
    if (!op) return notFound();

    await prisma.operation.update({ where: { id: opId }, data: { deletedAt: new Date() } });

    logger.audit("delete", "operation", getAuditContext(req, user, { targetId: opId }));

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/operations/[id]", method: "DELETE" });
  }
}, { requiredPermissions: ["operations.manage"] });
