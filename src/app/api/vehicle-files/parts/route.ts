import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";
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
      parts.map((p: { id: number; name: string; quantity: number; status: { label: string } | null }) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        status: p.status?.label ?? "",
      })),
    );
  } catch (error) {
    logger.error("Vehicle file parts fetch error", error as Error, { path: "/api/vehicle-files/parts", method: "GET" });
    return serverError();
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

    if (!name) return badRequest("Parça adı gereklidir.");

    const file = await prisma.vehicleFile.findFirst({ where: { id: fileId, deletedAt: null } });
    if (!file) return notFound("Araç dosyası bulunamadı.");

    const statusId = await ensureStatus(statusLabel);

    const created = await prisma.part.create({
      data: {
        name,
        quantity,
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
        status: created.status?.label ?? "",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Vehicle file part create error", error as Error, { path: "/api/vehicle-files/parts", method: "POST" });
    return serverError();
  }
}, { requiredPermissions: ["parts.manage"] });
