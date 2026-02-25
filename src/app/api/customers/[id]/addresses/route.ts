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

    const addresses = await prisma.customerAddress.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return json(addresses);
  } catch (error) {
    logger.error("Customer addresses fetch error", error as Error, { path: "/api/customers/[id]/addresses", method: "GET" });
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
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    const label = typeof body?.label === "string" ? body.label.trim() : null;
    const city = typeof body?.city === "string" ? body.city.trim() : null;
    const district = typeof body?.district === "string" ? body.district.trim() : null;
    const postalCode = typeof body?.postalCode === "string" ? body.postalCode.trim() : null;

    if (!address) return badRequest("address gereklidir.");

    const created = await prisma.customerAddress.create({
      data: { address, label, city, district, postalCode, customerId },
    });

    return json(created, { status: 201 });
  } catch (error) {
    logger.error("Customer address create error", error as Error, { path: "/api/customers/[id]/addresses", method: "POST" });
    return serverError();
  }
}, { requiredPermissions: ["customers.manage"] });
