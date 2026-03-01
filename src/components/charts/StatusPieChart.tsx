"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { status: string; label: string; count: number }[];
}

const COLORS = ["#38bdf8", "#fbbf24", "#a3e635"];

export default function StatusPieChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Durum Dağılımı</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
