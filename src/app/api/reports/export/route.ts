import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { handleApiError } from "@/lib/http";
import { logger } from "@/lib/logger";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");

    const where: Record<string, unknown> = { deletedAt: null };
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const files = await prisma.vehicleFile.findMany({
      where,
      include: {
        vehicle: true,
        customer: true,
        expert: true,
        parts: { where: { deletedAt: null } },
        operations: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = files.map((f: typeof files[number]) => {
      const partsTotal = f.parts.reduce((s: number, p: { totalPrice: unknown; unitPrice: unknown; quantity: number }) => s + (p.totalPrice ? Number(p.totalPrice) : (p.unitPrice ? Number(p.unitPrice) * p.quantity : 0)), 0);
      const opsLabor = f.operations.reduce((s: number, op: { laborCost: unknown }) => s + (op.laborCost ? Number(op.laborCost) : 0), 0);
      const opsMaterial = f.operations.reduce((s: number, op: { materialCost: unknown }) => s + (op.materialCost ? Number(op.materialCost) : 0), 0);
      const subtotal = partsTotal + opsLabor + opsMaterial;
      const discount = f.discount ? Number(f.discount) : 0;
      const taxRate = f.taxRate ? Number(f.taxRate) : 0;
      const taxAmount = subtotal * (taxRate / 100);
      const grandTotal = subtotal + taxAmount - discount;

      return {
        "Dosya No": f.fileNumber || `D-${f.id}`,
        "Plaka": f.vehicle.plate,
        "Marka/Model": f.brandModel,
        "Müşteri": f.customer.fullName,
        "Eksper": f.expert?.fullName || "—",
        "Durum": f.status,
        "Parça Sayısı": f.parts.length,
        "İşlem Sayısı": f.operations.length,
        "Parça Maliyeti": partsTotal,
        "İşçilik Maliyeti": opsLabor,
        "Malzeme Maliyeti": opsMaterial,
        "Alt Toplam": subtotal,
        "İndirim": discount,
        "KDV (%)": taxRate,
        "KDV Tutarı": taxAmount,
        "Genel Toplam": grandTotal,
        "Oluşturma Tarihi": f.createdAt.toLocaleDateString("tr-TR"),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Dosyalar");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rapor-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/reports/export", method: "GET" });
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });
