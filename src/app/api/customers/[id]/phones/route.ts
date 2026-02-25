import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

type Params = { id: string };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const GET = withAuth<Params>(async (_req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const customer = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) return notFound();

    const phones = await prisma.customerPhone.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return json(phones);
  } catch (error) {
    logger.error("Customer phones fetch error", error as Error, { path: "/api/customers/[id]/phones", method: "GET" });
    return serverError();
  }
}, { requiredPermissions: ["customers.manage"] });

export const POST = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const customer = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) return notFound();

    const body = await req.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const label = typeof body?.label === "string" ? body.label.trim() : null;

    if (!phone) return badRequest("phone gereklidir.");

    const created = await prisma.customerPhone.create({
      data: { phone, label, customerId },
    });

    return json(created, { status: 201 });
  } catch (error) {
    logger.error("Customer phone create error", error as Error, { path: "/api/customers/[id]/phones", method: "POST" });
    return serverError();
  }
}, { requiredPermissions: ["customers.manage"] });
