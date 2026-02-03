import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { withRateLimit } from "@/lib/api-guard";
import { withAuth } from "@/lib/api-guard";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";

// MIME types
const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

type Params = { path: string[] };

export const GET = withAuth(
  withRateLimit(async (
  _req: NextRequest,
  context?: { params: Promise<unknown> }
) => {
  try {
    const rawParams = context?.params as Promise<Params> | undefined;
    if (!rawParams) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const { path: pathSegments } = await rawParams;

    // Path güvenlik kontrolü (directory traversal önleme)
    const requestedPath = pathSegments.join("/");
    if (requestedPath.includes("..") || requestedPath.includes("~")) {
      return NextResponse.json({ error: "Geçersiz yol" }, { status: 400 });
    }

    // Dosya yolu
    const filePath = path.join(UPLOAD_DIR, requestedPath);

    // Dosya var mı kontrol
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    // Dosyayı oku
    const fileBuffer = await readFile(filePath);

    // MIME type belirle
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Response döndür
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { error: "Dosya okunurken hata oluştu" },
      { status: 500 }
    );
  }
  }, 120, 60000),
  { requiredPermissions: ["photos.manage"] }
);
