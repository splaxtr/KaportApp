import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizePlate } from "@/lib/plate";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

type VehiclePayload = {
  plate: string;
};

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const limit = Number(searchParams.get("limit") || "10");

    const where: Prisma.VehicleWhereInput = { deletedAt: null };
    if (q) {
      where.OR = [
        { plate: { contains: q, mode: "insensitive" as Prisma.QueryMode } },
        { plateNormalized: { startsWith: normalizePlate(q) } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit || 10,
      include: {
        _count: { select: { files: true } },
        files: {
          where: { deletedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: { customer: true },
        },
      },
    });

    return json(
      vehicles.map((v) => ({
        id: v.id,
        plate: v.plate,
        plateNormalized: v.plateNormalized,
        firstVisitAt: v.firstVisitAt,
        lastVisitAt: v.lastVisitAt,
        visitCount: v.visitCount,
        filesCount: v._count.files,
        lastFile: v.files[0]
          ? {
              id: v.files[0].id,
              brandModel: v.files[0].brandModel,
              color: v.files[0].color,
              customer: { id: v.files[0].customer.id, fullName: v.files[0].customer.fullName },
            }
          : null,
      })),
    );
  } catch (error) {
    logger.error("Vehicle API error", error as Error, { path: "/api/vehicles" });
    return serverError();
  }
}, { requiredPermissions: ["vehicles.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = (await req.json()) as VehiclePayload;
    const plate = typeof body?.plate === "string" ? body.plate.trim().toUpperCase() : "";

    if (!plate) return badRequest("plate gereklidir.");

    const plateNormalized = normalizePlate(plate);
    if (!plateNormalized) return badRequest("Geçersiz plaka.");

    const existing = await prisma.vehicle.findUnique({ where: { plateNormalized } });
    if (existing && !existing.deletedAt) {
      return badRequest("Bu plaka ile araç mevcut.");
    }

    const created = await prisma.vehicle.upsert({
      where: { plateNormalized },
      create: {
        plate,
        plateNormalized,
      },
      update: {
        deletedAt: null,
        plate,
      },
    });

    return json(created, { status: 201 });
  } catch (error) {
    logger.error("Vehicle API error", error as Error, { path: "/api/vehicles" });
    return serverError();
  }
}, { requiredPermissions: ["vehicles.manage"] });
