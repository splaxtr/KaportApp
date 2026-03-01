import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

type Params = { id: string; phoneId: string };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id, phoneId: phoneIdRaw } = await params;
    const customerId = parseId(id);
    const phoneId = parseId(phoneIdRaw);
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
    return handleApiError(error, logger.error.bind(logger), { path: "/api/customers/[id]/phones/[phoneId]", method: "PATCH" });
  }
}, { requiredPermissions: ["customers.manage"] });

export const DELETE = withAuth<Params>(async (_req: NextRequest, { params }) => {
  try {
    const { id, phoneId: phoneIdRaw } = await params;
    const customerId = parseId(id);
    const phoneId = parseId(phoneIdRaw);
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
    return handleApiError(error, logger.error.bind(logger), { path: "/api/customers/[id]/phones/[phoneId]", method: "DELETE" });
  }
}, { requiredPermissions: ["customers.manage"] });
