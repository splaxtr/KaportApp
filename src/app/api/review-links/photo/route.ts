import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

import { prisma } from "@/lib/prisma";
import { badRequest, notFound, serverError } from "@/lib/http";
import { verifyReviewSessionToken } from "@/lib/review-session";
import { withRateLimit } from "@/lib/api-guard";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";
const PUBLIC_URL_PREFIX = process.env.UPLOAD_URL_PREFIX || "/api/uploads";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const session = req.nextUrl.searchParams.get("session") || "";
    const photoId = Number(req.nextUrl.searchParams.get("photoId") || "");
    if (!session || !Number.isInteger(photoId) || photoId <= 0) return badRequest("Geçersiz istek");

    const payload = await verifyReviewSessionToken(session);
    if (!payload) return badRequest("Geçersiz oturum");

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, vehicleFileId: payload.vehicleFileId, deletedAt: null },
    });
    if (!photo) return notFound();
    if (!photo.url.startsWith(PUBLIC_URL_PREFIX)) return notFound();

    const relativePath = photo.url.replace(PUBLIC_URL_PREFIX, "");
    if (relativePath.includes("..") || relativePath.includes("~")) {
      return badRequest("Geçersiz yol");
    }

    const filePath = path.join(UPLOAD_DIR, relativePath);
    if (!existsSync(filePath)) return notFound("Dosya bulunamadı");

    const fileBuffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Review photo serve error:", error);
    return serverError();
  }
}, 120, 60000);
