import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

function parseId(id: string | null) {
  if (!id) return null;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: NextRequest) {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    const photos = await prisma.photo.findMany({
      where: { vehicleFileId: fileId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return json(
      photos.map((p) => ({
        id: p.id,
        url: p.url,
        title: p.title,
        note: p.note,
      })),
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    // Accept multipart form-data for real file uploads. Fallback to JSON "url" if provided.
    const createdRecords: { id: number; url: string; title: string | null; note: string | null }[] = [];
    let title: string | null = null;
    let note: string | null = null;

    const file = await prisma.vehicleFile.findFirst({ where: { id: fileId, deletedAt: null } });
    if (!file) return notFound("Araç dosyası bulunamadı.");

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const files = form.getAll("files").length > 0 ? form.getAll("files") : [form.get("file")].filter(Boolean);
      title = typeof form.get("title") === "string" ? form.get("title")!.trim() || null : null;
      note = typeof form.get("note") === "string" ? form.get("note")!.trim() || null : null;

      if (!files || files.length === 0) return badRequest("Fotoğraf dosyası zorunlu.");
      const fileEntries = files.filter((f): f is File => f instanceof File && f.size > 0);
      if (fileEntries.length === 0) return badRequest("Geçerli dosya bulunamadı.");

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      for (const file of fileEntries) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const filePath = path.join(uploadDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        const fileUrl = `/uploads/${fileName}`;

        const created = await prisma.photo.create({
          data: {
            url: fileUrl,
            title,
            note,
            vehicleFileId: fileId,
          },
        });
        createdRecords.push({ id: created.id, url: created.url, title: created.title, note: created.note });
      }
    } else {
      const body = await req.json().catch(() => ({}));
      const url = typeof body?.url === "string" ? body.url.trim() : "";
      title = typeof body?.title === "string" ? body.title.trim() : null;
      note = typeof body?.note === "string" ? body.note.trim() : null;
      if (url) {
        const created = await prisma.photo.create({
          data: { url, title, note, vehicleFileId: fileId },
        });
        createdRecords.push({ id: created.id, url: created.url, title: created.title, note: created.note });
      }
    }

    if (createdRecords.length === 0) return badRequest("Fotoğraf dosyası veya URL zorunlu.");

    return json(createdRecords, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
