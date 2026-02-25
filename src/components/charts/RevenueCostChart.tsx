"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { month: string; label: string; revenue: number; cost: number }[];
}

export default function RevenueCostChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Gelir / Maliyet</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }}
            formatter={(value: number | undefined) => value != null ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value) : ""}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          <Area type="monotone" dataKey="revenue" name="Gelir" stroke="#a3e635" fill="#a3e63533" strokeWidth={2} />
          <Area type="monotone" dataKey="cost" name="Maliyet" stroke="#f97316" fill="#f9731633" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
