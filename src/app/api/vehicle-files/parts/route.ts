import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

function parseId(id: string | null) {
  if (!id) return null;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function ensureStatus(label?: string | null) {
  const fallback = label?.trim() || "Beklemede";
  const existing = await prisma.partStatus.findFirst({ where: { label: fallback, deletedAt: null } });
  if (existing) return existing.id;
  const created = await prisma.partStatus.create({ data: { label: fallback } });
  return created.id;
}

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    const parts = await prisma.part.findMany({
      where: { vehicleFileId: fileId, deletedAt: null },
      include: { status: true },
      orderBy: { createdAt: "desc" },
    });

    return json(
      parts.map((p: { id: number; name: string; quantity: number; unitPrice: any; totalPrice: any; status: { label: string } | null }) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        totalPrice: p.totalPrice ? Number(p.totalPrice) : null,
        status: p.status?.label ?? "",
      })),
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicle-files/parts", method: "GET" });
  }
}, { requiredPermissions: ["parts.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const quantity = typeof body?.quantity === "number" && body.quantity > 0 ? body.quantity : 1;
    const statusLabel = typeof body?.status === "string" ? body.status.trim() : null;
    const rawUnitPrice = body?.unitPrice;
    const unitPrice = rawUnitPrice !== undefined && rawUnitPrice !== null && rawUnitPrice !== "" ? Number(rawUnitPrice) : null;
    const totalPrice = unitPrice !== null && !isNaN(unitPrice) ? unitPrice * quantity : null;

    if (!name) return badRequest("Parça adı gereklidir.");

    const file = await prisma.vehicleFile.findFirst({ where: { id: fileId, deletedAt: null } });
    if (!file) return notFound("Araç dosyası bulunamadı.");

    const statusId = await ensureStatus(statusLabel);

    const created = await prisma.part.create({
      data: {
        name,
        quantity,
        unitPrice: unitPrice !== null && !isNaN(unitPrice) ? unitPrice : undefined,
        totalPrice: totalPrice !== null && !isNaN(totalPrice) ? totalPrice : undefined,
        vehicleFileId: fileId,
        statusId,
      },
      include: { status: true },
    });

    return json(
      {
        id: created.id,
        name: created.name,
        quantity: created.quantity,
        unitPrice: created.unitPrice ? Number(created.unitPrice) : null,
        totalPrice: created.totalPrice ? Number(created.totalPrice) : null,
        status: created.status?.label ?? "",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicle-files/parts", method: "POST" });
  }
}, { requiredPermissions: ["parts.manage"] });
