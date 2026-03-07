import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { handleApiError } from "@/lib/http";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { validate } from "@/lib/validations";

const createAppointmentSchema = z.object({
  date: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  type: z.enum(["intake", "delivery", "inspection", "expert", "other"]).default("other"),
  title: z.string().min(2).max(200),
  notes: z.string().max(1000).optional().nullable(),
  vehicleFileId: z.number().int().positive().optional().nullable(),
  customerId: z.number().int().positive().optional().nullable(),
  assignedToId: z.number().int().positive().optional().nullable(),
});

// GET: Randevuları listele
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");

    const where: Record<string, unknown> = { deletedAt: null };
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true } },
        vehicleFile: { select: { id: true, brandModel: true, vehicle: { select: { plate: true } } } },
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/appointments", method: "GET" });
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });

// POST: Yeni randevu oluştur
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const validation = validate(createAppointmentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(validation.data.date),
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : null,
        type: validation.data.type,
        title: validation.data.title,
        notes: validation.data.notes ?? null,
        vehicleFileId: validation.data.vehicleFileId ?? null,
        customerId: validation.data.customerId ?? null,
        assignedToId: validation.data.assignedToId ?? null,
      },
      include: {
        customer: { select: { id: true, fullName: true } },
        vehicleFile: { select: { id: true, brandModel: true, vehicle: { select: { plate: true } } } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/appointments", method: "POST" });
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });
