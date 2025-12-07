import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

type Params = { params: { id: string } };
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const expertId = parseId(params.id);
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

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const expertId = parseId(params.id);
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
    console.error(error);
    return serverError();
  }
}
