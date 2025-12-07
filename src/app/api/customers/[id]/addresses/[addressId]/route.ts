import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

type Params = { params: { id: string; addressId: string } };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const customerId = parseId(params.id);
    const addressId = parseId(params.addressId);
    if (!customerId || !addressId) return badRequest("Geçersiz id");

    const existing = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId, deletedAt: null },
    });
    if (!existing) return notFound();

    const body = await req.json();
    const data: {
      label?: string | null;
      address?: string;
      city?: string | null;
      district?: string | null;
      postalCode?: string | null;
    } = {};
    if (typeof body?.label === "string") data.label = body.label.trim();
    if (typeof body?.address === "string") data.address = body.address.trim();
    if (body?.city !== undefined) data.city = body.city ? String(body.city).trim() : null;
    if (body?.district !== undefined) data.district = body.district ? String(body.district).trim() : null;
    if (body?.postalCode !== undefined) data.postalCode = body.postalCode ? String(body.postalCode).trim() : null;

    const updated = await prisma.customerAddress.update({
      where: { id: addressId },
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
    const addressId = parseId(params.addressId);
    if (!customerId || !addressId) return badRequest("Geçersiz id");

    const existing = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId, deletedAt: null },
    });
    if (!existing) return notFound();

    await prisma.customerAddress.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
    });

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
