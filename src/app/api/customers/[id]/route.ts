import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";
import { getAuditContext } from "@/lib/audit";
import { updateCustomerSchema, phoneSchema, addressSchema } from "@/lib/validations";
import { z } from "zod";

type Params = { id: string };

type CustomerUpdatePayload = {
  fullName?: string;
  email?: string | null;
  tcVkn?: string | null;
  phones?: { label?: string | null; phone: string }[];
  addresses?: {
    label?: string | null;
    address: string;
    city?: string | null;
    district?: string | null;
    postalCode?: string | null;
  }[];
};

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const GET = withAuth<Params>(async (_req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      include: {
        phones: { where: { deletedAt: null } },
        addresses: { where: { deletedAt: null } },
        notes: {
          where: { deletedAt: null },
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) return notFound();

    return json({
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phones: customer.phones,
      addresses: customer.addresses,
      notes: customer.notes.map((n: { id: number; note: string; author: { id: number; fullName: string; email: string } | null; createdAt: Date }) => ({
        id: n.id,
        note: n.note,
        author: n.author ? { id: n.author.id, fullName: n.author.fullName, email: n.author.email } : null,
        createdAt: n.createdAt,
      })),
      createdAt: customer.createdAt,
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/customers/[id]", method: "GET" });
  }
}, { requiredPermissions: ["customers.manage"] });

export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const existing = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!existing) return notFound();

    const rawBody = await req.json().catch(() => ({}));

    // Zod ile doğrulama
    const patchSchema = updateCustomerSchema.extend({
      phones: z.array(phoneSchema).optional(),
      addresses: z.array(addressSchema).optional(),
    });

    const parsed = patchSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Geçersiz veri";
      return badRequest(firstError);
    }

    const body = parsed.data;
    const data: { fullName?: string; email?: string | null; tcVkn?: string | null } = {};

    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.email !== undefined) data.email = body.email;
    if (body.tcVkn !== undefined) data.tcVkn = body.tcVkn;

    const phones =
      Array.isArray(body.phones) && body.phones.length > 0
        ? body.phones.map((p) => ({
            label: p.label ?? null,
            phone: p.phone.trim(),
          }))
        : null;

    const addresses =
      Array.isArray(body.addresses) && body.addresses.length > 0
        ? body.addresses.map((a) => ({
            label: a.label ?? null,
            address: a.address.trim(),
            city: a.city ?? null,
            district: a.district ?? null,
            postalCode: a.postalCode ?? null,
          }))
        : null;

    // Replace phones/addresses if provided: soft delete existing then add new.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.customer.update({
        where: { id: customerId },
        data,
      });

      if (phones) {
        await tx.customerPhone.updateMany({
          where: { customerId, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        if (phones.length) {
          await tx.customerPhone.createMany({
            data: phones.map((p) => ({ ...p, customerId })),
          });
        }
      }

      if (addresses) {
        await tx.customerAddress.updateMany({
          where: { customerId, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        if (addresses.length) {
          await tx.customerAddress.createMany({
            data: addresses.map((a) => ({ ...a, customerId })),
          });
        }
      }

      return updated;
    });

    const refreshed = await prisma.customer.findUnique({
      where: { id: result.id },
      include: {
        phones: { where: { deletedAt: null } },
        addresses: { where: { deletedAt: null } },
      },
    });

    return json({
      id: refreshed?.id ?? null,
      fullName: refreshed?.fullName ?? null,
      email: refreshed?.email ?? null,
      phones: refreshed?.phones ?? [],
      addresses: refreshed?.addresses ?? [],
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/customers/[id]", method: "PATCH" });
  }
}, { requiredPermissions: ["customers.manage"] });

export const DELETE = withAuth<Params>(async (req: NextRequest, { params, user }) => {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const existing = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!existing) return notFound();

    await prisma.$transaction([
      prisma.customer.update({ where: { id: customerId }, data: { deletedAt: new Date() } }),
      prisma.customerPhone.updateMany({ where: { customerId, deletedAt: null }, data: { deletedAt: new Date() } }),
      prisma.customerAddress.updateMany({ where: { customerId, deletedAt: null }, data: { deletedAt: new Date() } }),
      prisma.customerNote.updateMany({ where: { customerId, deletedAt: null }, data: { deletedAt: new Date() } }),
    ]);

    logger.audit("delete", "customer", getAuditContext(req, user, { targetId: customerId }));

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/customers/[id]", method: "DELETE" });
  }
}, { requiredPermissions: ["customers.manage"] });
