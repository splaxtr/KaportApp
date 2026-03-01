import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

function createToken() {
  return `rvw-${randomBytes(12).toString("hex")}`;
}

function createKey() {
  return randomBytes(16).toString("hex");
}

function statusFrom(exp: Date | null, revokedAt: Date | null) {
  if (revokedAt) return "revoked";
  if (exp && exp.getTime() < Date.now()) return "expired";
  return "active";
}

export const GET = withAuth(async () => {
  try {
    const tokens = await prisma.reviewToken.findMany({
      where: { deletedAt: null },
      include: {
        vehicleFile: { include: { vehicle: true } },
        accessKeys: { where: { usedAt: null } },
      },
      orderBy: { createdAt: "desc" },
    });

    return json(
      tokens.map((t: { id: number; token: string; vehicleFile: { vehicle: { plate: string } }; vehicleFileId: number; expiresAt: Date | null; revokedAt: Date | null; createdAt: Date; accessKeys: { key: string }[] }) => ({
        id: t.id,
        token: t.token,
        plate: t.vehicleFile.vehicle.plate,
        fileId: t.vehicleFileId,
        status: statusFrom(t.expiresAt, t.revokedAt),
        expiresAt: t.expiresAt,
        createdAt: t.createdAt,
        keys: t.accessKeys.map((k: { key: string }) => k.key),
      })),
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/review-links", method: "GET" });
  }
}, { requiredPermissions: ["reviews.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const fileId = typeof body?.fileId === "number" ? body.fileId : Number(body?.fileId);
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;

    if (!fileId || Number.isNaN(fileId)) return badRequest("fileId gereklidir.");

    const file = await prisma.vehicleFile.findFirst({
      where: { id: fileId, deletedAt: null },
      include: { vehicle: true },
    });
    if (!file) return badRequest("Araç dosyası bulunamadı.");

    const token = await prisma.reviewToken.create({
      data: {
        token: createToken(),
        vehicleFileId: fileId,
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      },
    });

    // üç tek-kullanımlık anahtar oluştur
    const keys = Array.from({ length: 3 }, () => createKey());
    await prisma.reviewAccessKey.createMany({
      data: keys.map((k) => ({ key: k, tokenId: token.id })),
    });

    return json(
      {
        id: token.id,
        token: token.token,
        plate: file.vehicle.plate,
        fileId: fileId,
        status: statusFrom(token.expiresAt, token.revokedAt),
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        keys,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/review-links", method: "POST" });
  }
}, { requiredPermissions: ["reviews.manage"] });
