"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type PartStatus = { status: string; count: number };

export function PartDistribution({ data }: { data: PartStatus[] }) {
  const trendIcons = [ArrowUpRight, ArrowDownRight];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Parça Durum Dağılımı</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.length === 0 && <p className="text-sm text-muted-foreground">Parça verisi bulunamadı</p>}
          {data.map((s, idx) => {
            const Icon = trendIcons[idx % trendIcons.length];
            return (
              <div key={s.status} className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{s.status}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">{s.count}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
