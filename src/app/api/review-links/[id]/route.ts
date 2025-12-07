import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, serverError } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return badRequest("Geçersiz id");

    const token = await prisma.reviewToken.findFirst({ where: { id, deletedAt: null } });
    if (!token) return notFound();

    const body = await req.json().catch(() => ({}));
    const action = body?.action as "revoke" | "restore" | "delete";
    if (!action) return badRequest("action gerekli");

    if (action === "revoke") {
      await prisma.reviewToken.update({ where: { id }, data: { revokedAt: new Date() } });
    } else if (action === "restore") {
      await prisma.reviewToken.update({ where: { id }, data: { revokedAt: null } });
    } else if (action === "delete") {
      await prisma.reviewToken.update({ where: { id }, data: { deletedAt: new Date() } });
    }

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
