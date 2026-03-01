import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

export const GET = withAuth(async () => {
  try {
    const items = await prisma.partStatus.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return json(
      items.map((i: { id: number; label: string; color: string | null; sortOrder: number }) => ({
        id: i.id,
        label: i.label,
        color: i.color,
        sortOrder: i.sortOrder,
      })),
    );
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/part-statuses", method: "GET" });
  }
}, { requiredPermissions: ["parts.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const color = typeof body?.color === "string" ? body.color.trim() : null;
    const sortOrder = typeof body?.sortOrder === "number" ? body.sortOrder : 0;

    if (!label) return badRequest("label gereklidir.");

    const created = await prisma.partStatus.create({
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
    return handleApiError(error, logger.error.bind(logger), { path: "/api/part-statuses", method: "POST" });
  }
}, { requiredPermissions: ["parts.manage"] });
