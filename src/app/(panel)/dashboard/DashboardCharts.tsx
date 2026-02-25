"use client";

import { useEffect, useState } from "react";
import MonthlyVolumeChart from "@/components/charts/MonthlyVolumeChart";
import StatusPieChart from "@/components/charts/StatusPieChart";
import RevenueCostChart from "@/components/charts/RevenueCostChart";

type StatsData = {
  monthlyVolume: { month: string; label: string; count: number }[];
  statusDistribution: { status: string; label: string; count: number }[];
  revenueCost: { month: string; label: string; revenue: number; cost: number }[];
};

export default function DashboardCharts() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4 h-[260px]" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MonthlyVolumeChart data={data.monthlyVolume} />
      <StatusPieChart data={data.statusDistribution} />
      <RevenueCostChart data={data.revenueCost} />
    </div>
  );
}
