import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";

export const GET = withAuth(async () => {
  try {
    const items = await prisma.operationStatus.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return json(
      items.map((i) => ({
        id: i.id,
        label: i.label,
        color: i.color,
        sortOrder: i.sortOrder,
      })),
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}, { requiredPermissions: ["operations.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const color = typeof body?.color === "string" ? body.color.trim() : null;
    const sortOrder = typeof body?.sortOrder === "number" ? body.sortOrder : 0;

    if (!label) return badRequest("label gereklidir.");

    const created = await prisma.operationStatus.create({
      data: {
        label,
        color: color || null,
        sortOrder,
      },
    });

    return json(
      { id: created.id, label: created.label, color: created.color, sortOrder: created.sortOrder },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}, { requiredPermissions: ["operations.manage"] });
