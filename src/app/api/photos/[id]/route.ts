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

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const photoId = parseId(id);
    if (!photoId) return badRequest("Geçersiz fotoğraf id");

    const existing = await prisma.photo.findFirst({ where: { id: photoId, deletedAt: null } });
    if (!existing) return notFound();

    const body = await req.json().catch(() => ({}));
    const data: { title?: string | null; note?: string | null } = {};
    if (body?.title !== undefined) data.title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
    if (body?.note !== undefined) data.note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

    const updated = await prisma.photo.update({
      where: { id: photoId },
      data,
    });

    return json({ id: updated.id, url: updated.url, title: updated.title, note: updated.note });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/photos/[id]", method: "PATCH" });
  }
}, { requiredPermissions: ["photos.manage"] });

export const DELETE = withAuth<Params>(async (req: NextRequest, { params, user }) => {
  try {
    const { id } = await params;
    const photoId = parseId(id);
    if (!photoId) return badRequest("Geçersiz fotoğraf id");

    const existing = await prisma.photo.findFirst({ where: { id: photoId, deletedAt: null } });
    if (!existing) return notFound();

    await prisma.photo.update({ where: { id: photoId }, data: { deletedAt: new Date() } });

    logger.audit("delete", "photo", getAuditContext(req, user, { targetId: photoId }));

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/photos/[id]", method: "DELETE" });
  }
}, { requiredPermissions: ["photos.manage"] });
