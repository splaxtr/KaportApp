import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

type Params = { params: { id: string; phoneId: string } };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const customerId = parseId(params.id);
    const phoneId = parseId(params.phoneId);
    if (!customerId || !phoneId) return badRequest("Geçersiz id");

    const existing = await prisma.customerPhone.findFirst({
      where: { id: phoneId, customerId, deletedAt: null },
    });
    if (!existing) return notFound();

    const body = await req.json();
    const data: { phone?: string; label?: string | null } = {};
    if (typeof body?.phone === "string") data.phone = body.phone.trim();
    if (body?.label !== undefined) data.label = body.label ? String(body.label).trim() : null;

    const updated = await prisma.customerPhone.update({
      where: { id: phoneId },
      data,
    });

    return json(updated);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const customerId = parseId(params.id);
    const phoneId = parseId(params.phoneId);
    if (!customerId || !phoneId) return badRequest("Geçersiz id");

    const existing = await prisma.customerPhone.findFirst({
      where: { id: phoneId, customerId, deletedAt: null },
    });
    if (!existing) return notFound();

    await prisma.customerPhone.update({
      where: { id: phoneId },
      data: { deletedAt: new Date() },
    });

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
