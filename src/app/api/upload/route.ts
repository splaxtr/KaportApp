import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { uploadFile, uploadBase64 } from "@/lib/storage";
import { logger } from "@/lib/logger";

// POST - Fotoğraf yükle
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const contentType = req.headers.get("content-type") || "";

    // FormData ile upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const vehicleFileId = Number(formData.get("vehicleFileId"));
      const title = formData.get("title") as string | null;
      const note = formData.get("note") as string | null;

      if (!file) {
        return badRequest("Dosya gereklidir");
      }

      if (!vehicleFileId || isNaN(vehicleFileId)) {
        return badRequest("vehicleFileId gereklidir");
      }

      // Dosya kontrolü
      const vehicleFile = await prisma.vehicleFile.findFirst({
        where: { id: vehicleFileId, deletedAt: null },
      });

      if (!vehicleFile) {
        return badRequest("Araç dosyası bulunamadı");
      }

      // Dosyayı yükle
      const result = await uploadFile(file, vehicleFileId);

      if (!result.success) {
        return badRequest(result.error);
      }

      // Veritabanına kaydet
      const photo = await prisma.photo.create({
        data: {
          url: result.url,
          title: title?.trim() || null,
          note: note?.trim() || null,
          vehicleFileId,
          uploadedById: user.id,
        },
      });

      return json(
        {
          id: photo.id,
          url: photo.url,
          title: photo.title,
          note: photo.note,
          size: result.size,
          createdAt: photo.createdAt,
        },
        { status: 201 }
      );
    }

    // JSON (Base64) ile upload
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      const { vehicleFileId, base64, mimeType, title, note } = body;

      if (!base64 || !mimeType) {
        return badRequest("base64 ve mimeType gereklidir");
      }

      if (!vehicleFileId || isNaN(Number(vehicleFileId))) {
        return badRequest("vehicleFileId gereklidir");
      }

      // Dosya kontrolü
      const vehicleFile = await prisma.vehicleFile.findFirst({
        where: { id: Number(vehicleFileId), deletedAt: null },
      });

      if (!vehicleFile) {
        return badRequest("Araç dosyası bulunamadı");
      }

      // Dosyayı yükle
      const result = await uploadBase64(base64, Number(vehicleFileId), mimeType);

      if (!result.success) {
        return badRequest(result.error);
      }

      // Veritabanına kaydet
      const photo = await prisma.photo.create({
        data: {
          url: result.url,
          title: title?.trim() || null,
          note: note?.trim() || null,
          vehicleFileId: Number(vehicleFileId),
          uploadedById: user.id,
        },
      });

      return json(
        {
          id: photo.id,
          url: photo.url,
          title: photo.title,
          note: photo.note,
          size: result.size,
          createdAt: photo.createdAt,
        },
        { status: 201 }
      );
    }

    return badRequest("Desteklenmeyen içerik türü");
  } catch (error) {
    logger.error("Upload error", error as Error, { path: "/api/upload", method: "POST" });
    return serverError();
  }
}, { requiredPermissions: ["photos.manage"] });
