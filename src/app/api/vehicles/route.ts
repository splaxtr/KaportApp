import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizePlate } from "@/lib/plate";
import { badRequest, json, handleApiError } from "@/lib/http";
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { deletedAt: null };
    if (q) {
      where.OR = [
        { plate: { contains: q, mode: "insensitive" } },
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vehicles.map((v: any) => ({
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
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicles", method: "GET" });
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
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicles", method: "POST" });
  }
}, { requiredPermissions: ["vehicles.manage"] });
