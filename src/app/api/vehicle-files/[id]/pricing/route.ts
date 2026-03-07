import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { notFound, handleApiError } from "@/lib/http";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { validate } from "@/lib/validations";

const pricingUpdateSchema = z.object({
  discount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

// GET: Maliyet özeti
export const GET = withAuth(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params as { id: string };
    const fileId = Number(id);
    if (!fileId || fileId <= 0) return notFound();

    const vehicleFile = await prisma.vehicleFile.findFirst({
      where: { id: fileId, deletedAt: null },
      include: {
        parts: { where: { deletedAt: null }, include: { status: true } },
        operations: { where: { deletedAt: null }, include: { status: true } },
      },
    });

    if (!vehicleFile) return notFound();

    // Parça maliyetleri
    let partsTotal = 0;
    const partsBreakdown = vehicleFile.parts.map((p: typeof vehicleFile.parts[number]) => {
      const unitPrice = p.unitPrice ? Number(p.unitPrice) : 0;
      const totalPrice = p.totalPrice ? Number(p.totalPrice) : unitPrice * p.quantity;
      partsTotal += totalPrice;
      return {
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unitPrice,
        totalPrice,
        status: p.status?.label,
      };
    });

    // İşlem maliyetleri
    let laborTotal = 0;
    let materialTotal = 0;
    const operationsBreakdown = vehicleFile.operations.map((op: typeof vehicleFile.operations[number]) => {
      const laborCost = op.laborCost ? Number(op.laborCost) : 0;
      const materialCost = op.materialCost ? Number(op.materialCost) : 0;
      laborTotal += laborCost;
      materialTotal += materialCost;
      return {
        id: op.id,
        title: op.title,
        laborCost,
        materialCost,
        total: laborCost + materialCost,
        status: op.status?.label,
      };
    });

    const subtotal = partsTotal + laborTotal + materialTotal;
    const discount = vehicleFile.discount ? Number(vehicleFile.discount) : 0;
    const taxRate = vehicleFile.taxRate ? Number(vehicleFile.taxRate) : 0;
    const afterDiscount = subtotal - discount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const grandTotal = afterDiscount + taxAmount;

    return NextResponse.json({
      fileId,
      parts: { items: partsBreakdown, total: partsTotal },
      operations: { items: operationsBreakdown, laborTotal, materialTotal, total: laborTotal + materialTotal },
      summary: {
        subtotal,
        discount,
        taxRate,
        afterDiscount,
        taxAmount,
        grandTotal,
      },
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicle-files/[id]/pricing", method: "GET" });
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });

// PATCH: İndirim/KDV güncelle
export const PATCH = withAuth(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params as { id: string };
    const fileId = Number(id);
    if (!fileId || fileId <= 0) return notFound();

    const body = await req.json().catch(() => ({}));
    const validation = validate(pricingUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await prisma.vehicleFile.findFirst({
      where: { id: fileId, deletedAt: null },
    });
    if (!existing) return notFound();

    const updated = await prisma.vehicleFile.update({
      where: { id: fileId },
      data: {
        ...(validation.data.discount !== undefined && { discount: validation.data.discount }),
        ...(validation.data.taxRate !== undefined && { taxRate: validation.data.taxRate }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      discount: updated.discount ? Number(updated.discount) : 0,
      taxRate: updated.taxRate ? Number(updated.taxRate) : 0,
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicle-files/[id]/pricing", method: "PATCH" });
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });
