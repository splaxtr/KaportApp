import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { deleteFile } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { getAuditContext } from "@/lib/audit";

type TrashItem = {
  id: number;
  type: "customer" | "expert" | "vehicle" | "vehicleFile" | "part" | "operation" | "photo";
  label: string;
  deletedAt: Date;
};

type ActionPayload =
  | { action: "restore" | "purge"; id: number; type: TrashItem["type"] }
  | { action: "purgeAll" };

export const GET = withAuth(async () => {
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
      ...customers.map((c: { id: number; fullName: string; deletedAt: Date | null }) => ({
        id: c.id,
        type: "customer",
        label: c.fullName,
        deletedAt: c.deletedAt!,
      })),
      ...experts.map((e: { id: number; fullName: string; deletedAt: Date | null }) => ({
        id: e.id,
        type: "expert",
        label: e.fullName,
        deletedAt: e.deletedAt!,
      })),
      ...vehicles.map((v: { id: number; plate: string; deletedAt: Date | null }) => ({
        id: v.id,
        type: "vehicle",
        label: v.plate,
        deletedAt: v.deletedAt!,
      })),
      ...files.map((f: { id: number; vehicle: { plate: string }; brandModel: string; fileNumber: string | null; deletedAt: Date | null }) => ({
        id: f.id,
        type: "vehicleFile",
        label: `${f.vehicle.plate} • ${f.brandModel} ${f.fileNumber ? `(${f.fileNumber})` : ""}`.trim(),
        deletedAt: f.deletedAt!,
      })),
      ...parts.map((p: { id: number; name: string; deletedAt: Date | null }) => ({
        id: p.id,
        type: "part",
        label: p.name,
        deletedAt: p.deletedAt!,
      })),
      ...operations.map((o: { id: number; title: string; deletedAt: Date | null }) => ({
        id: o.id,
        type: "operation",
        label: o.title,
        deletedAt: o.deletedAt!,
      })),
      ...photos.map((p: { id: number; title: string | null; url: string; deletedAt: Date | null }) => ({
        id: p.id,
        type: "photo",
        label: p.title ?? p.url,
        deletedAt: p.deletedAt!,
      })),
    ];

    return json(items);
  } catch (error) {
    logger.error("Trash list error", error as Error, { path: "/api/trash", method: "GET" });
    return serverError();
  }
}, { requireAdmin: true });

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
  const photos = await prisma.photo.findMany({ where: { vehicleFileId: id } });
  for (const photo of photos) {
    await deleteFile(photo.url);
  }
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
      const photo = await prisma.photo.findUnique({ where: { id } });
      if (photo) {
        await deleteFile(photo.url);
      }
      return prisma.photo.delete({ where: { id } });
    default:
      throw new Error("unknown type");
  }
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
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
      logger.audit("purge_all", "trash", getAuditContext(req, user));
      return json({ ok: true });
    }

    const { action, id, type } = body as Extract<ActionPayload, { action: "restore" | "purge" }>;
    if (!id || !type) return badRequest("Eksik alan");

    if (action === "restore") {
      await restoreItem(type, id);
      logger.audit("restore", type, getAuditContext(req, user, { targetId: id }));
    } else if (action === "purge") {
      await purgeItem(type, id);
      logger.audit("purge", type, getAuditContext(req, user, { targetId: id }));
    }

    return json({ ok: true });
  } catch (error) {
    logger.error("Trash action error", error as Error, { path: "/api/trash", method: "POST" });
    return serverError();
  }
}, { requireAdmin: true });
