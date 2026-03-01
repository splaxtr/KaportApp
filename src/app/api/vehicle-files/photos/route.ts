import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";
import { uploadBase64, uploadFile } from "@/lib/storage";

function parseId(id: string | null) {
  if (!id) return null;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    const photos = await prisma.photo.findMany({
      where: { vehicleFileId: fileId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return json(
      photos.map((p: { id: number; url: string; title: string | null; note: string | null }) => ({
        id: p.id,
        url: p.url,
        title: p.title,
        note: p.note,
      })),
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicle-files/photos", method: "GET" });
  }
}, { requiredPermissions: ["photos.manage"] });

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    // Accept multipart form-data for real file uploads. Fallback to JSON (base64 or url).
    const createdRecords: { id: number; url: string; title: string | null; note: string | null }[] = [];
    let title: string | null = null;
    let note: string | null = null;

    const file = await prisma.vehicleFile.findFirst({ where: { id: fileId, deletedAt: null } });
    if (!file) return notFound("Araç dosyası bulunamadı.");

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const files = form.getAll("files").length > 0 ? form.getAll("files") : [form.get("file")].filter(Boolean);
      const rawTitle = form.get("title");
      const rawNote = form.get("note");
      title = typeof rawTitle === "string" ? rawTitle.trim() || null : null;
      note = typeof rawNote === "string" ? rawNote.trim() || null : null;

      if (!files || files.length === 0) return badRequest("Fotoğraf dosyası zorunlu.");
      const fileEntries = files.filter((f): f is File => f instanceof File && f.size > 0);
      if (fileEntries.length === 0) return badRequest("Geçerli dosya bulunamadı.");

      for (const file of fileEntries) {
        const upload = await uploadFile(file, fileId);
        if (!upload.success) return badRequest(upload.error);

        const created = await prisma.photo.create({
          data: {
            url: upload.url,
            title,
            note,
            vehicleFileId: fileId,
            uploadedById: user.id,
          },
        });
        createdRecords.push({ id: created.id, url: created.url, title: created.title, note: created.note });
      }
    } else {
      const body = await req.json().catch(() => ({}));
      const base64 = typeof body?.base64 === "string" ? body.base64.trim() : "";
      const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim() : "";
      title = typeof body?.title === "string" ? body.title.trim() : null;
      note = typeof body?.note === "string" ? body.note.trim() : null;

      if (base64 && mimeType) {
        const upload = await uploadBase64(base64, fileId, mimeType);
        if (!upload.success) return badRequest(upload.error);
        const created = await prisma.photo.create({
          data: { url: upload.url, title, note, vehicleFileId: fileId, uploadedById: user.id },
        });
        createdRecords.push({ id: created.id, url: created.url, title: created.title, note: created.note });
      }
    }

    if (createdRecords.length === 0) return badRequest("Fotoğraf dosyası veya base64 zorunlu.");

    return json(createdRecords, { status: 201 });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicle-files/photos", method: "POST" });
  }
}, { requiredPermissions: ["photos.manage"] });
