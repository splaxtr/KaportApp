import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizePlate } from "@/lib/plate";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

type VehicleFilePayload = {
  vehicleId?: number;
  plate?: string;
  brandModel?: string;
  color?: string | null;
  accidentDate?: string | null;
  fileNumber?: string | null;
  quickNote?: string | null;
  customerId?: number;
  expertId?: number | null;
};

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") || "0");
    const plate = searchParams.get("plate")?.trim();

    const files = await prisma.vehicleFile.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
        ...(plate ? { vehicle: { plate: { contains: plate, mode: "insensitive" } } } : {}),
      },
      include: {
        vehicle: true,
        customer: true,
      },
      orderBy: { updatedAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });

    return json(
      files.map((f) => ({
        id: f.id,
        plate: f.vehicle.plate,
        brandModel: f.brandModel,
        color: f.color,
        customer: { id: f.customer.id, fullName: f.customer.fullName },
        status: f.status,
        quickNote: f.quickNote,
        updatedAt: f.updatedAt,
        fileNumber: f.fileNumber,
        accidentDate: f.accidentDate,
      })),
    );
  } catch (error) {
    logger.error("VehicleFile API error", error as Error, { path: "/api/vehicle-files" });
    return serverError();
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = (await req.json()) as VehicleFilePayload;
  const vehicleId = typeof body?.vehicleId === "number" ? body.vehicleId : null;
  const plate = typeof body?.plate === "string" ? body.plate.trim().toUpperCase() : "";
  const brandModel = typeof body?.brandModel === "string" ? body.brandModel.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : "";
  const accidentDate = typeof body?.accidentDate === "string" && body.accidentDate.length > 0 ? body.accidentDate : null;
  const fileNumber = typeof body?.fileNumber === "string" && body.fileNumber.length > 0 ? body.fileNumber.trim() : null;
  const quickNote = typeof body?.quickNote === "string" ? body.quickNote.trim() : null;
  const customerId = typeof body?.customerId === "number" ? body.customerId : null;
  const expertId = typeof body?.expertId === "number" ? body.expertId : null;

    if (!plate) return badRequest("plate gereklidir.");
    if (!brandModel) return badRequest("brandModel gereklidir.");
    if (!customerId) return badRequest("customerId gereklidir.");

    let plateNormalized: string | null = null;
    let vehicleIdResolved: number | null = vehicleId;

    if (vehicleIdResolved) {
      const existingVehicle = await prisma.vehicle.findFirst({ where: { id: vehicleIdResolved, deletedAt: null } });
      if (!existingVehicle) return badRequest("Araç bulunamadı.");
      plateNormalized = existingVehicle.plateNormalized;
    } else {
      plateNormalized = normalizePlate(plate);
      if (!plateNormalized) return badRequest("Geçersiz plaka.");
    }

    const customer = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) return badRequest("Müşteri bulunamadı.");

    const expert = expertId ? await prisma.expert.findFirst({ where: { id: expertId, deletedAt: null } }) : null;
    if (expertId && !expert) return badRequest("Eksper bulunamadı.");

    const result = await prisma.$transaction(async (tx) => {
      const vehicle =
        vehicleIdResolved !== null
          ? await tx.vehicle.update({
              where: { id: vehicleIdResolved },
              data: {
                lastVisitAt: new Date(),
                visitCount: { increment: 1 },
              },
            })
          : await tx.vehicle.upsert({
              where: { plateNormalized: plateNormalized! },
              create: {
                plate,
                plateNormalized: plateNormalized!,
                firstVisitAt: new Date(),
                lastVisitAt: new Date(),
                visitCount: 1,
              },
              update: {
                deletedAt: null,
                plate,
                lastVisitAt: new Date(),
                visitCount: { increment: 1 },
              },
            });

      const created = await tx.vehicleFile.create({
        data: {
          vehicle: { connect: { id: vehicle.id } },
          customer: { connect: { id: customer.id } },
          brandModel,
          color: color || "",
          accidentDate: accidentDate ? new Date(accidentDate) : null,
          fileNumber,
          quickNote,
          expert: expert ? { connect: { id: expert.id } } : undefined,
          status: "open",
        },
        include: {
          vehicle: true,
          customer: true,
          expert: true,
        },
      });

      return created;
    });

    return json(
      {
        id: result.id,
        plate: result.vehicle.plate,
        customer: { id: result.customer.id, fullName: result.customer.fullName },
        brandModel: result.brandModel,
        color: result.color,
        accidentDate: result.accidentDate,
        fileNumber: result.fileNumber,
        quickNote: result.quickNote,
        status: result.status,
        expert: result.expert ? { id: result.expert.id, fullName: result.expert.fullName } : null,
        createdAt: result.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("VehicleFile API error", error as Error, { path: "/api/vehicle-files" });
    return serverError();
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });
