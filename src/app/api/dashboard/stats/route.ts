import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { handleApiError } from "@/lib/http";
import { logger } from "@/lib/logger";

type MonthCount = { month: string; count: bigint };
type RevenueCostRow = {
  month: string;
  parts_total: string | null;
  ops_labor: string | null;
  ops_material: string | null;
  discount_sum: string | null;
  tax_weighted: string | null;
};

export const GET = withAuth(async () => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Aylık hacim — DB seviyesinde gruplama
    const monthlyFilesRaw: MonthCount[] = await prisma.$queryRawUnsafe(
      `SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
       FROM "VehicleFile"
       WHERE "deletedAt" IS NULL AND "createdAt" >= $1
       GROUP BY to_char("createdAt", 'YYYY-MM')`,
      sixMonthsAgo
    );

    const monthlyVolume: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyVolume[key] = 0;
    }
    monthlyFilesRaw.forEach((row: MonthCount) => {
      if (row.month in monthlyVolume) monthlyVolume[row.month] = Number(row.count);
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

    // Gelir/maliyet — DB seviyesinde aggregate
    const revenueCostRaw: RevenueCostRow[] = await prisma.$queryRawUnsafe(
      `SELECT
        to_char(vf."createdAt", 'YYYY-MM') as month,
        COALESCE(SUM(p_agg.total), 0)::text as parts_total,
        COALESCE(SUM(o_agg.labor), 0)::text as ops_labor,
        COALESCE(SUM(o_agg.material), 0)::text as ops_material,
        COALESCE(SUM(vf."discount"), 0)::text as discount_sum,
        SUM(
          (COALESCE(p_agg.total, 0) + COALESCE(o_agg.labor, 0) + COALESCE(o_agg.material, 0) - COALESCE(vf."discount", 0))
          * (COALESCE(vf."taxRate", 20) / 100)
        )::text as tax_weighted
      FROM "VehicleFile" vf
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(COALESCE(p."totalPrice", p."unitPrice" * p."quantity")), 0) as total
        FROM "Part" p WHERE p."vehicleFileId" = vf.id AND p."deletedAt" IS NULL
      ) p_agg ON true
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(COALESCE(o."laborCost", 0)), 0) as labor,
          COALESCE(SUM(COALESCE(o."materialCost", 0)), 0) as material
        FROM "Operation" o WHERE o."vehicleFileId" = vf.id AND o."deletedAt" IS NULL
      ) o_agg ON true
      WHERE vf."deletedAt" IS NULL AND vf."createdAt" >= $1
      GROUP BY to_char(vf."createdAt", 'YYYY-MM')`,
      sixMonthsAgo
    );

    const revenueCost: Record<string, { revenue: number; cost: number }> = {};
    Object.keys(monthlyVolume).forEach((key) => {
      revenueCost[key] = { revenue: 0, cost: 0 };
    });

    for (const row of revenueCostRaw) {
      if (!(row.month in revenueCost)) continue;
      const partsTotal = Number(row.parts_total || 0);
      const opsLabor = Number(row.ops_labor || 0);
      const opsMaterial = Number(row.ops_material || 0);
      const subtotal = partsTotal + opsLabor + opsMaterial;
      const discount = Number(row.discount_sum || 0);
      const taxAmount = Number(row.tax_weighted || 0);
      const revenue = subtotal - discount + taxAmount;
      const cost = partsTotal + opsMaterial;
      revenueCost[row.month] = { revenue, cost };
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
    return handleApiError(error, logger.error.bind(logger), { path: "/api/dashboard/stats", method: "GET" });
  }
});
