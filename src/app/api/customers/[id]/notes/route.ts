import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_req: NextRequest, { params }: Params) {
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
      notes.map((n) => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt,
        author: n.author ? { id: n.author.id, fullName: n.author.fullName, email: n.author.email } : null,
      })),
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const customerId = parseId(id);
    if (!customerId) return badRequest("Geçersiz müşteri id");

    const customer = await prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) return notFound();

    const body = await req.json();
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const authorId = body?.authorId ? Number(body.authorId) : null;

    if (!note) return badRequest("note gereklidir.");

    const created = await prisma.customerNote.create({
      data: { note, customerId, authorId: authorId || undefined },
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
    console.error(error);
    return serverError();
  }
}
