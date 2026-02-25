import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { notFound, serverError } from "@/lib/http";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { validate } from "@/lib/validations";

const updateAppointmentSchema = z.object({
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  type: z.enum(["intake", "delivery", "inspection", "expert", "other"]).optional(),
  status: z.enum(["scheduled", "confirmed", "cancelled", "completed"]).optional(),
  title: z.string().min(2).max(200).optional(),
  notes: z.string().max(1000).optional().nullable(),
  vehicleFileId: z.number().int().positive().optional().nullable(),
  customerId: z.number().int().positive().optional().nullable(),
  assignedToId: z.number().int().positive().optional().nullable(),
});

type Params = { id: string };

// GET: Tek randevu
export const GET = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findFirst({
      where: { id: Number(id), deletedAt: null },
      include: {
        customer: { select: { id: true, fullName: true } },
        vehicleFile: { select: { id: true, brandModel: true, vehicle: { select: { plate: true } } } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });
    if (!appointment) return notFound();
    return NextResponse.json(appointment);
  } catch (error) {
    logger.error("Appointment fetch error", error as Error, { path: "/api/appointments/[id]", method: "GET" });
    return serverError();
  }
});

// PATCH: Randevu güncelle
export const PATCH = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const existing = await prisma.appointment.findFirst({ where: { id: Number(id), deletedAt: null } });
    if (!existing) return notFound();

    const body = await req.json().catch(() => ({}));
    const validation = validate(updateAppointmentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (validation.data.date) data.date = new Date(validation.data.date);
    if (validation.data.endDate !== undefined) data.endDate = validation.data.endDate ? new Date(validation.data.endDate) : null;
    if (validation.data.type) data.type = validation.data.type;
    if (validation.data.status) data.status = validation.data.status;
    if (validation.data.title) data.title = validation.data.title;
    if (validation.data.notes !== undefined) data.notes = validation.data.notes;
    if (validation.data.vehicleFileId !== undefined) data.vehicleFileId = validation.data.vehicleFileId;
    if (validation.data.customerId !== undefined) data.customerId = validation.data.customerId;
    if (validation.data.assignedToId !== undefined) data.assignedToId = validation.data.assignedToId;

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data,
      include: {
        customer: { select: { id: true, fullName: true } },
        vehicleFile: { select: { id: true, brandModel: true, vehicle: { select: { plate: true } } } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Appointment update error", error as Error, { path: "/api/appointments/[id]", method: "PATCH" });
    return serverError();
  }
});

// DELETE: Randevu sil (soft)
export const DELETE = withAuth<Params>(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params;
    const existing = await prisma.appointment.findFirst({ where: { id: Number(id), deletedAt: null } });
    if (!existing) return notFound();

    await prisma.appointment.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Appointment delete error", error as Error, { path: "/api/appointments/[id]", method: "DELETE" });
    return serverError();
  }
});
