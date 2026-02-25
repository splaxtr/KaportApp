import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { createCustomerSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";

// GET - Müşteri listesi (tüm kullanıcılar)
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phones: { some: { phone: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
      include: {
        phones: { where: { deletedAt: null } },
        addresses: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: "desc" },
    });

    return json(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customers.map((c: any) => ({
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        tcVkn: c.tcVkn,
        phones: c.phones,
        addresses: c.addresses,
        createdAt: c.createdAt,
      }))
    );
  } catch (error) {
    logger.error("Customer list error", error as Error, { path: "/api/customers", method: "GET" });
    return serverError();
  }
}, { requiredPermissions: ["customers.manage"] });

// POST - Yeni müşteri oluştur (tüm kullanıcılar)
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Zod validation
    const validation = validate(createCustomerSchema, body);
    if (!validation.success) {
      return badRequest(validation.error);
    }

    const { fullName, email, tcVkn, note, phones, addresses } = validation.data;

    const created = await prisma.customer.create({
      data: {
        fullName,
        email: email ?? null,
        tcVkn: tcVkn ?? null,
        phones: phones?.length
          ? {
              createMany: {
                data: phones.map((p) => ({
                  label: p.label ?? null,
                  phone: p.phone,
                })),
              },
            }
          : undefined,
        addresses: addresses?.length
          ? {
              createMany: {
                data: addresses.map((a) => ({
                  label: a.label ?? null,
                  address: a.address,
                  city: a.city ?? null,
                  district: a.district ?? null,
                  postalCode: a.postalCode ?? null,
                })),
              },
            }
          : undefined,
        notes: note
          ? {
              create: { note },
            }
          : undefined,
      },
      include: {
        phones: { where: { deletedAt: null } },
        addresses: { where: { deletedAt: null } },
      },
    });

    return json(
      {
        id: created.id,
        fullName: created.fullName,
        email: created.email,
        tcVkn: created.tcVkn,
        phones: created.phones,
        addresses: created.addresses,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Customer create error", error as Error, { path: "/api/customers", method: "POST" });
    return serverError();
  }
}, { requiredPermissions: ["customers.manage"] });
