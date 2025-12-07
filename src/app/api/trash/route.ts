import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";

type TrashItem = {
  id: number;
  type: "customer" | "expert" | "vehicle" | "vehicleFile" | "part" | "operation" | "photo";
  label: string;
  deletedAt: Date;
};

type ActionPayload =
  | { action: "restore" | "purge"; id: number; type: TrashItem["type"] }
  | { action: "purgeAll" };

export async function GET() {
  try {
    const [customers, experts, vehicles, files, parts, operations, photos] = await Promise.all([
      prisma.customer.findMany({ where: { deletedAt: { not: null } } }),
      prisma.expert.findMany({ where: { deletedAt: { not: null } } }),
      prisma.vehicle.findMany({ where: { deletedAt: { not: null } } }),
      prisma.vehicleFile.findMany({
        where: { deletedAt: { not: null } },
        include: { vehicle: true, customer: true },
      }),
      prisma.part.findMany({ where: { deletedAt: { not: null } } }),
      prisma.operation.findMany({ where: { deletedAt: { not: null } } }),
      prisma.photo.findMany({ where: { deletedAt: { not: null } } }),
    ]);

    const items: TrashItem[] = [
      ...customers.map<TrashItem>((c) => ({
        id: c.id,
        type: "customer",
        label: c.fullName,
        deletedAt: c.deletedAt!,
      })),
      ...experts.map<TrashItem>((e) => ({
        id: e.id,
        type: "expert",
        label: e.fullName,
        deletedAt: e.deletedAt!,
      })),
      ...vehicles.map<TrashItem>((v) => ({
        id: v.id,
        type: "vehicle",
        label: v.plate,
        deletedAt: v.deletedAt!,
      })),
      ...files.map<TrashItem>((f) => ({
        id: f.id,
        type: "vehicleFile",
        label: `${f.vehicle.plate} • ${f.brandModel} ${f.fileNumber ? `(${f.fileNumber})` : ""}`.trim(),
        deletedAt: f.deletedAt!,
      })),
      ...parts.map<TrashItem>((p) => ({
        id: p.id,
        type: "part",
        label: p.name,
        deletedAt: p.deletedAt!,
      })),
      ...operations.map<TrashItem>((o) => ({
        id: o.id,
        type: "operation",
        label: o.title,
        deletedAt: o.deletedAt!,
      })),
      ...photos.map<TrashItem>((p) => ({
        id: p.id,
        type: "photo",
        label: p.title ?? p.url,
        deletedAt: p.deletedAt!,
      })),
    ];

    return json(items);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

async function restoreItem(type: TrashItem["type"], id: number) {
  switch (type) {
    case "customer":
      return prisma.customer.update({ where: { id }, data: { deletedAt: null } });
    case "expert":
      return prisma.expert.update({ where: { id }, data: { deletedAt: null } });
    case "vehicle":
      return prisma.vehicle.update({ where: { id }, data: { deletedAt: null } });
    case "vehicleFile":
      return prisma.vehicleFile.update({ where: { id }, data: { deletedAt: null } });
    case "part":
      return prisma.part.update({ where: { id }, data: { deletedAt: null } });
    case "operation":
      return prisma.operation.update({ where: { id }, data: { deletedAt: null } });
    case "photo":
      return prisma.photo.update({ where: { id }, data: { deletedAt: null } });
    default:
      throw new Error("unknown type");
  }
}

async function purgeVehicleFile(id: number) {
  await prisma.$transaction([
    prisma.part.deleteMany({ where: { vehicleFileId: id } }),
    prisma.operation.deleteMany({ where: { vehicleFileId: id } }),
    prisma.photo.deleteMany({ where: { vehicleFileId: id } }),
  ]);
  await prisma.vehicleFile.delete({ where: { id } });
}

async function purgeCustomer(id: number) {
  const files = await prisma.vehicleFile.findMany({ where: { customerId: id } });
  for (const file of files) {
    await purgeVehicleFile(file.id);
  }
  await prisma.$transaction([
    prisma.customerPhone.deleteMany({ where: { customerId: id } }),
    prisma.customerAddress.deleteMany({ where: { customerId: id } }),
    prisma.customerNote.deleteMany({ where: { customerId: id } }),
  ]);
  await prisma.customer.delete({ where: { id } });
}

async function purgeVehicle(id: number) {
  const files = await prisma.vehicleFile.findMany({ where: { vehicleId: id } });
  for (const file of files) {
    await purgeVehicleFile(file.id);
  }
  await prisma.vehicle.delete({ where: { id } });
}

async function purgeExpert(id: number) {
  await prisma.vehicleFile.updateMany({ where: { expertId: id }, data: { expertId: null } });
  await prisma.expert.delete({ where: { id } });
}

async function purgeItem(type: TrashItem["type"], id: number) {
  switch (type) {
    case "customer":
      return purgeCustomer(id);
    case "expert":
      return purgeExpert(id);
    case "vehicle":
      return purgeVehicle(id);
    case "vehicleFile":
      return purgeVehicleFile(id);
    case "part":
      return prisma.part.delete({ where: { id } });
    case "operation":
      return prisma.operation.delete({ where: { id } });
    case "photo":
      return prisma.photo.delete({ where: { id } });
    default:
      throw new Error("unknown type");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ActionPayload;
    if (!body || !("action" in body)) return badRequest("Geçersiz istek");

    if (body.action === "purgeAll") {
      // Purge in dependency order
      const files = await prisma.vehicleFile.findMany({ where: { deletedAt: { not: null } } });
      for (const file of files) {
        await purgeVehicleFile(file.id);
      }
      const vehicles = await prisma.vehicle.findMany({ where: { deletedAt: { not: null } } });
      for (const v of vehicles) {
        await purgeVehicle(v.id);
      }
      const customers = await prisma.customer.findMany({ where: { deletedAt: { not: null } } });
      for (const c of customers) {
        await purgeCustomer(c.id);
      }
      await prisma.operation.deleteMany({ where: { deletedAt: { not: null } } });
      await prisma.part.deleteMany({ where: { deletedAt: { not: null } } });
      await prisma.photo.deleteMany({ where: { deletedAt: { not: null } } });
      const experts = await prisma.expert.findMany({ where: { deletedAt: { not: null } } });
      for (const e of experts) {
        await purgeExpert(e.id);
      }
      return json({ ok: true });
    }

    const { action, id, type } = body as Extract<ActionPayload, { action: "restore" | "purge" }>;
    if (!id || !type) return badRequest("Eksik alan");

    if (action === "restore") {
      await restoreItem(type, id);
    } else if (action === "purge") {
      await purgeItem(type, id);
    }

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
