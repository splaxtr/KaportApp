import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";

function parseId(id: string | null) {
  if (!id) return null;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function ensureStatus(label?: string | null) {
  const fallback = label?.trim() || "Beklemede";
  const existing = await prisma.operationStatus.findFirst({ where: { label: fallback, deletedAt: null } });
  if (existing) return existing.id;
  const created = await prisma.operationStatus.create({ data: { label: fallback } });
  return created.id;
}

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    const ops = await prisma.operation.findMany({
      where: { vehicleFileId: fileId, deletedAt: null },
      include: { status: true },
      orderBy: { createdAt: "desc" },
    });

    return json(
      ops.map((o) => ({
        id: o.id,
        title: o.title,
        note: o.description,
        status: o.status?.label ?? "",
      })),
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}, { requiredPermissions: ["operations.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const fileId = parseId(req.nextUrl.searchParams.get("fileId"));
    if (!fileId) return badRequest("Geçersiz dosya id");

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const statusLabel = typeof body?.status === "string" ? body.status.trim() : null;
    const note = typeof body?.note === "string" ? body.note.trim() : null;

    if (!title) return badRequest("İşlem adı zorunlu.");

    const file = await prisma.vehicleFile.findFirst({ where: { id: fileId, deletedAt: null } });
    if (!file) return notFound("Araç dosyası bulunamadı.");

    const statusId = await ensureStatus(statusLabel);

    const created = await prisma.operation.create({
      data: {
        title,
        description: note,
        vehicleFileId: fileId,
        statusId,
      },
      include: { status: true },
    });

    return json(
      {
        id: created.id,
        title: created.title,
        note: created.description,
        status: created.status?.label ?? "",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}, { requiredPermissions: ["operations.manage"] });
