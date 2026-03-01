import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

type Params = { id: string };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const GET = withAuth<Params>(async (_req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const customer = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) return notFound();

    const notes = await prisma.customerNote.findMany({
      where: { customerId, deletedAt: null },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    return json(
      notes.map((n: { id: number; note: string; createdAt: Date; author: { id: number; fullName: string; email: string } | null }) => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt,
        author: n.author ? { id: n.author.id, fullName: n.author.fullName, email: n.author.email } : null,
      })),
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/customers/[id]/notes", method: "GET" });
  }
}, { requiredPermissions: ["customers.manage"] });

export const POST = withAuth<Params>(async (req: NextRequest, { params, user }) => {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const customer = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) return notFound();

    const body = await req.json();
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (!note) return badRequest("note gereklidir.");

    const created = await prisma.customerNote.create({
      data: { note, customerId, authorId: user.id },
      include: { author: true },
    });

    return json(
      {
        id: created.id,
        note: created.note,
        createdAt: created.createdAt,
        author: created.author
          ? { id: created.author.id, fullName: created.author.fullName, email: created.author.email }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/customers/[id]/notes", method: "POST" });
  }
}, { requiredPermissions: ["customers.manage"] });
