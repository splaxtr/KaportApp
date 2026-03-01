import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withRateLimit } from "@/lib/api-guard";
import { logger } from "@/lib/logger";
import { createReviewSessionToken } from "@/lib/review-session";

function statusFrom(exp: Date | null, revokedAt: Date | null) {
  if (revokedAt) return "revoked";
  if (exp && exp.getTime() < Date.now()) return "expired";
  return "active";
}

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!token || !key) return badRequest("token ve key gereklidir.");

    const link = await prisma.reviewToken.findFirst({
      where: { token, deletedAt: null },
      include: {
        vehicleFile: {
          include: {
            vehicle: true,
            customer: true,
            expert: true,
            parts: { where: { deletedAt: null } },
            operations: { where: { deletedAt: null } },
            photos: { where: { deletedAt: null } },
          },
        },
        accessKeys: { where: { key } },
      },
    });
    if (!link) return notFound();

    const status = statusFrom(link.expiresAt, link.revokedAt);
    if (status !== "active") return badRequest("Link aktif değil.");

    const access = link.accessKeys.find((k: { usedAt: Date | null }) => !k.usedAt);
    if (!access) return badRequest("Anahtar geçersiz veya kullanıldı.");

    const update = await prisma.reviewAccessKey.updateMany({
      where: { id: access.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (update.count === 0) return badRequest("Anahtar geçersiz veya kullanıldı.");

    const session = await createReviewSessionToken({
      reviewTokenId: link.id,
      vehicleFileId: link.vehicleFileId,
    });

    const vf = link.vehicleFile;
    return json({
      session,
      vehicle: {
        plate: vf.vehicle.plate,
        brandModel: vf.brandModel,
        color: vf.color,
        accidentDate: vf.accidentDate,
        fileNumber: vf.fileNumber ?? vf.id.toString(),
      },
      customer: { fullName: vf.customer.fullName },
      expert: vf.expert ? { fullName: vf.expert.fullName } : null,
      quickNote: vf.quickNote,
      parts: vf.parts.map((p: { id: number; name: string; quantity: number }) => ({ id: p.id, name: p.name, quantity: p.quantity })),
      operations: vf.operations.map((o: { id: number; title: string }) => ({ id: o.id, title: o.title })),
      photos: vf.photos.map((p: { id: number; title: string | null; note: string | null }) => ({
        id: p.id,
        url: `/api/review-links/photo?session=${encodeURIComponent(session)}&photoId=${p.id}`,
        title: p.title,
        note: p.note,
      })),
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/review-links/view", method: "POST" });
  }
}, 10, 60000);
