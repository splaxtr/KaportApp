import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
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
    console.error(error);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const statusId = parseId(id);
    if (!statusId) return badRequest("Geçersiz id");

    const existing = await prisma.operationStatus.findFirst({ where: { id: statusId, deletedAt: null } });
    if (!existing) return notFound();

    await prisma.operationStatus.update({ where: { id: statusId }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
