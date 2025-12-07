import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const opId = parseId(id);
    if (!opId) return badRequest("Geçersiz işlem id");

    const op = await prisma.operation.findFirst({ where: { id: opId, deletedAt: null } });
    if (!op) return notFound();

    const body = await req.json().catch(() => ({}));
    const data: { title?: string; description?: string | null; statusId?: number | null } = {};

    if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (body?.note !== undefined) data.description = typeof body.note === "string" ? body.note.trim() : null;

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
      status: updated.status?.label ?? "",
    });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const opId = parseId(id);
    if (!opId) return badRequest("Geçersiz işlem id");

    const op = await prisma.operation.findFirst({ where: { id: opId, deletedAt: null } });
    if (!op) return notFound();

    await prisma.operation.update({ where: { id: opId }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
