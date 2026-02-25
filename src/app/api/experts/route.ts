import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, serverError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

type ExpertPayload = {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  note?: string | null;
};

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const experts = await prisma.expert.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { company: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return json(
      experts.map((e: { id: number; fullName: string; phone: string | null; email: string | null; company: string | null; note: string | null; createdAt: Date }) => ({
        id: e.id,
        fullName: e.fullName,
        phone: e.phone,
        email: e.email,
        company: e.company,
        note: e.note,
        createdAt: e.createdAt,
      })),
    );
  } catch (error) {
    logger.error("Experts fetch error", error as Error, { path: "/api/experts", method: "GET" });
    return serverError();
  }
}, { requiredPermissions: ["experts.manage"] });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = (await req.json()) as ExpertPayload;
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const company = typeof body?.company === "string" ? body.company.trim() : null;
    const note = typeof body?.note === "string" ? body.note.trim() : null;

    if (!fullName) return badRequest("fullName gereklidir.");

    const created = await prisma.expert.create({
      data: {
        fullName,
        phone,
        email,
        company,
        note,
      },
    });

    return json(
      {
        id: created.id,
        fullName: created.fullName,
        phone: created.phone,
        email: created.email,
        company: created.company,
        note: created.note,
        createdAt: created.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Expert create error", error as Error, { path: "/api/experts", method: "POST" });
    return serverError();
  }
}, { requiredPermissions: ["experts.manage"] });
