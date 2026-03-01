import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";
import { getAuditContext } from "@/lib/audit";

type Params = { id: string };
type ExpertPayload = {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  note?: string | null;
};

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const DELETE = withAuth<Params>(async (req: NextRequest, { params, user }) => {
  try {
    const { id } = await params;
    const expertId = parseId(id);
    if (!expertId) return badRequest("Geçersiz eksper id");

    const existing = await prisma.expert.findFirst({ where: { id: expertId, deletedAt: null } });
    if (!existing) return notFound();

    await prisma.$transaction([
      prisma.expert.update({ where: { id: expertId }, data: { deletedAt: new Date() } }),
      prisma.vehicleFile.updateMany({
        where: { expertId, deletedAt: null },
        data: { expertId: null },
      }),
    ]);

    logger.audit("delete", "expert", getAuditContext(req, user, { targetId: expertId }));

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/experts/[id]", method: "DELETE" });
  }
}, { requiredPermissions: ["experts.manage"] });

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const expertId = parseId(id);
    if (!expertId) return badRequest("Geçersiz eksper id");

    const existing = await prisma.expert.findFirst({ where: { id: expertId, deletedAt: null } });
    if (!existing) return notFound();

    const body = (await req.json().catch(() => ({}))) as ExpertPayload;
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const company = typeof body?.company === "string" ? body.company.trim() : null;
    const note = typeof body?.note === "string" ? body.note.trim() : null;

    if (fullName !== null && fullName.length === 0) return badRequest("Ad soyad boş olamaz.");

    const updated = await prisma.expert.update({
      where: { id: expertId },
      data: {
        fullName: fullName ?? undefined,
        phone: phone ?? null,
        email: email ?? null,
        company: company ?? null,
        note: note ?? null,
      },
    });

    return json({
      id: updated.id,
      fullName: updated.fullName,
      phone: updated.phone,
      email: updated.email,
      company: updated.company,
      note: updated.note,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/experts/[id]", method: "PATCH" });
  }
}, { requiredPermissions: ["experts.manage"] });
