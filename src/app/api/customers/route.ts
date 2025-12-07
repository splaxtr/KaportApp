import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";

type CustomerPayload = {
  fullName?: string;
  email?: string | null;
  tcVkn?: string | null;
  note?: string | null;
  phones?: { label?: string | null; phone: string }[];
  addresses?: {
    label?: string | null;
    address: string;
    city?: string | null;
    district?: string | null;
    postalCode?: string | null;
  }[];
};

export async function GET(req: NextRequest) {
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
      customers.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        tcVkn: c.tcVkn,
        phones: c.phones,
        addresses: c.addresses,
        createdAt: c.createdAt,
      })),
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CustomerPayload;
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const email =
      typeof body?.email === "string" && body.email.length > 0 ? body.email.trim().toLowerCase() : null;
    const tcVkn = typeof body?.tcVkn === "string" && body.tcVkn.trim().length > 0 ? body.tcVkn.trim() : null;
    const note = typeof body?.note === "string" && body.note.trim().length > 0 ? body.note.trim() : null;

    if (!fullName) {
      return badRequest("fullName gereklidir.");
    }

    const phones =
      Array.isArray(body?.phones) && body.phones.length > 0
        ? body.phones.map((p) => ({
            label: p.label ?? null,
            phone: p.phone.trim(),
          }))
        : [];

    const addresses =
      Array.isArray(body?.addresses) && body.addresses.length > 0
        ? body.addresses.map((a) => ({
            label: a.label ?? null,
            address: a.address.trim(),
            city: a.city ?? null,
            district: a.district ?? null,
            postalCode: a.postalCode ?? null,
          }))
        : [];

    const created = await prisma.customer.create({
      data: {
        fullName,
        email,
        tcVkn,
        phones: phones.length ? { createMany: { data: phones } } : undefined,
        addresses: addresses.length ? { createMany: { data: addresses } } : undefined,
        notes: note
          ? {
              create: {
                note,
              },
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
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
