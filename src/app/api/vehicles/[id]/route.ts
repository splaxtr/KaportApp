import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";
import { normalizePlate } from "@/lib/plate";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const vehicleId = parseId(id);
    if (!vehicleId) return badRequest("Geçersiz araç id");

    const existing = await prisma.vehicle.findFirst({ where: { id: vehicleId, deletedAt: null } });
    if (!existing) return notFound();

    const now = new Date();

    await prisma.$transaction([
      prisma.vehicle.update({ where: { id: vehicleId }, data: { deletedAt: now } }),
      prisma.vehicleFile.updateMany({ where: { vehicleId, deletedAt: null }, data: { deletedAt: now } }),
      prisma.part.updateMany({
        where: { vehicleFile: { vehicleId }, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.operation.updateMany({
        where: { vehicleFile: { vehicleId }, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.photo.updateMany({
        where: { vehicleFile: { vehicleId }, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.reviewToken.updateMany({
        where: { vehicleFile: { vehicleId }, deletedAt: null },
        data: { deletedAt: now },
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
    const { id } = await params;
    const vehicleId = parseId(id);
    if (!vehicleId) return badRequest("Geçersiz araç id");

    const existing = await prisma.vehicle.findFirst({ where: { id: vehicleId, deletedAt: null } });
    if (!existing) return notFound();

    const body = await req.json().catch(() => ({}));
    const plate = typeof body?.plate === "string" ? body.plate.trim().toUpperCase() : "";
    if (!plate) return badRequest("plate gereklidir.");

    const plateNormalized = normalizePlate(plate);
    if (!plateNormalized) return badRequest("Geçersiz plaka.");

    const duplicate = await prisma.vehicle.findFirst({
      where: { plateNormalized, deletedAt: null, id: { not: vehicleId } },
    });
    if (duplicate) return badRequest("Bu plaka başka bir araçta kayıtlı.");

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { plate, plateNormalized },
    });

    return json({
      id: updated.id,
      plate: updated.plate,
      plateNormalized: updated.plateNormalized,
    });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
