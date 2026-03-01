import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

type Params = { id: string };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const statusId = parseId(id);
    if (!statusId) return badRequest("Geçersiz id");

    const existing = await prisma.operationStatus.findFirst({ where: { id: statusId, deletedAt: null } });
    if (!existing) return notFound();

    const body = await req.json().catch(() => ({}));
    const data: { label?: string; color?: string | null; sortOrder?: number } = {};

    if (typeof body?.label === "string" && body.label.trim()) data.label = body.label.trim();
    if (body?.color !== undefined) data.color = typeof body.color === "string" && body.color.trim() ? body.color.trim() : null;
    if (typeof body?.sortOrder === "number") data.sortOrder = body.sortOrder;

    const updated = await prisma.operationStatus.update({
      where: { id: statusId },
      data,
    });

    return json({ id: updated.id, label: updated.label, color: updated.color, sortOrder: updated.sortOrder });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/operation-statuses/[id]", method: "PATCH" });
  }
}, { requiredPermissions: ["operations.manage"] });

export const DELETE = withAuth<Params>(async (_req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const statusId = parseId(id);
    if (!statusId) return badRequest("Geçersiz id");

    const existing = await prisma.operationStatus.findFirst({ where: { id: statusId, deletedAt: null } });
    if (!existing) return notFound();

    await prisma.operationStatus.update({ where: { id: statusId }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/operation-statuses/[id]", method: "DELETE" });
  }
}, { requiredPermissions: ["operations.manage"] });
