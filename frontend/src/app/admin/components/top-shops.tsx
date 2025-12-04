"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Shop = { shopName: string; jobCount: number };

export function TopShops({ shops }: { shops: Shop[] }) {
  const max = Math.max(...shops.map((s) => s.jobCount), 1);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">En Yoğun Şubeler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {shops.length === 0 && <p className="text-sm text-muted-foreground">Şube verisi bulunamadı</p>}
          {shops.map((s) => (
            <div key={s.shopName} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{s.shopName}</span>
                <span className="text-foreground">{s.jobCount}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full bg-primary/80")}
                  style={{ width: `${(s.jobCount / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
