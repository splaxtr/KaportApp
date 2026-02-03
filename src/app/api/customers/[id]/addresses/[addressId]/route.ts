import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";

type Params = { id: string; addressId: string };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id, addressId: addrId } = await params;
    const customerId = parseId(id);
    const addressId = parseId(addrId);
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
}, { requiredPermissions: ["customers.manage"] });

export const DELETE = withAuth<Params>(async (_req: NextRequest, { params }) => {
  try {
    const { id, addressId: addrId } = await params;
    const customerId = parseId(id);
    const addressId = parseId(addrId);
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
}, { requiredPermissions: ["customers.manage"] });
