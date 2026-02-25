import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { serverError } from "@/lib/http";
import { logger } from "@/lib/logger";

export const GET = withAuth(async () => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Aylık hacim (son 6 ay dosya sayısı)
    const monthlyFiles = await prisma.vehicleFile.groupBy({
      by: ["createdAt"],
      where: {
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      _count: true,
    });

    // Aylara grupla
    const monthlyVolume: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyVolume[key] = 0;
    }
    monthlyFiles.forEach((f: { createdAt: Date; _count: number }) => {
      const d = new Date(f.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyVolume) monthlyVolume[key]++;
    });

    const monthlyVolumeData = Object.entries(monthlyVolume).map(([month, count]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("tr-TR", { month: "short" }),
      count,
    }));

    // Durum dağılımı
    const statusCounts = await prisma.vehicleFile.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    });

    const statusDistribution = statusCounts.map((s: { status: string; _count: number }) => ({
      status: s.status,
      label: s.status === "open" ? "Açık" : s.status === "pending" ? "Beklemede" : "Tamamlandı",
      count: s._count,
    }));

    // Gelir/maliyet (son 6 ay)
    const filesWithCosts = await prisma.vehicleFile.findMany({
      where: { deletedAt: null, createdAt: { gte: sixMonthsAgo } },
      include: {
        parts: { where: { deletedAt: null } },
        operations: { where: { deletedAt: null } },
      },
    });

    const revenueCost: Record<string, { revenue: number; cost: number }> = {};
    Object.keys(monthlyVolume).forEach((key) => {
      revenueCost[key] = { revenue: 0, cost: 0 };
    });

    for (const f of filesWithCosts) {
      const d = new Date(f.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!(key in revenueCost)) continue;

      const partsTotal = f.parts.reduce((s: number, p: { totalPrice: unknown; unitPrice: unknown; quantity: number }) => s + (p.totalPrice ? Number(p.totalPrice) : (p.unitPrice ? Number(p.unitPrice) * p.quantity : 0)), 0);
      const opsTotal = f.operations.reduce((s: number, op: { laborCost: unknown; materialCost: unknown }) => s + (op.laborCost ? Number(op.laborCost) : 0) + (op.materialCost ? Number(op.materialCost) : 0), 0);
      const subtotal = partsTotal + opsTotal;
      const discount = f.discount ? Number(f.discount) : 0;
      const taxRate = f.taxRate ? Number(f.taxRate) : 20;
      const afterDiscount = subtotal - discount;
      const grandTotal = afterDiscount * (1 + taxRate / 100);

      revenueCost[key].revenue += grandTotal;
      revenueCost[key].cost += partsTotal + f.operations.reduce((s: number, op: { materialCost: unknown }) => s + (op.materialCost ? Number(op.materialCost) : 0), 0);
    }

    const revenueCostData = Object.entries(revenueCost).map(([month, data]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("tr-TR", { month: "short" }),
      revenue: Math.round(data.revenue),
      cost: Math.round(data.cost),
    }));

    return NextResponse.json({
      monthlyVolume: monthlyVolumeData,
      statusDistribution,
      revenueCost: revenueCostData,
    });
  } catch (error) {
    logger.error("Dashboard stats error", error as Error, { path: "/api/dashboard/stats", method: "GET" });
    return serverError();
  }
});
