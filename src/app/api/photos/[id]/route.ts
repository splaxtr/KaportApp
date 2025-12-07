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
    const photoId = parseId(id);
    if (!photoId) return badRequest("Geçersiz fotoğraf id");

    const existing = await prisma.photo.findFirst({ where: { id: photoId, deletedAt: null } });
    if (!existing) return notFound();

    const body = await req.json().catch(() => ({}));
    const data: { title?: string | null; note?: string | null; url?: string | null } = {};
    if (body?.title !== undefined) data.title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
    if (body?.note !== undefined) data.note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
    if (body?.url !== undefined) data.url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : null;

    const updated = await prisma.photo.update({
      where: { id: photoId },
      data,
    });

    return json({ id: updated.id, url: updated.url, title: updated.title, note: updated.note });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const photoId = parseId(id);
    if (!photoId) return badRequest("Geçersiz fotoğraf id");

    const existing = await prisma.photo.findFirst({ where: { id: photoId, deletedAt: null } });
    if (!existing) return notFound();

    await prisma.photo.update({ where: { id: photoId }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
