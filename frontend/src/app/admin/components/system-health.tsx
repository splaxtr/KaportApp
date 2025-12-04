"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Props = {
  apiHealth: "ok" | "degraded" | "down";
  dbLatency: number;
  storage: "ok" | "warning" | "error";
  uptime: number;
};

const healthBadge = (state: Props["apiHealth"]) => {
  if (state === "ok") return <Badge className="bg-emerald-500/20 text-emerald-300">API Sağlıklı</Badge>;
  if (state === "degraded") return <Badge className="bg-amber-500/20 text-amber-200">Kısmen</Badge>;
  return <Badge className="bg-rose-500/20 text-rose-200">Kapalı</Badge>;
};

const storageBadge = (state: Props["storage"]) => {
  if (state === "ok") return <Badge className="bg-emerald-500/20 text-emerald-300">Depolama Sağlıklı</Badge>;
  if (state === "warning") return <Badge className="bg-amber-500/20 text-amber-200">Uyarı</Badge>;
  return <Badge className="bg-rose-500/20 text-rose-200">Hata</Badge>;
};

function formatUptime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function SystemHealth({ apiHealth, dbLatency, storage, uptime }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 lg:grid-cols-2"
    >
      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Sistem Sağlığı</CardTitle>
          {healthBadge(apiHealth)}
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>DB Gecikme</span>
            <span className="text-foreground">{dbLatency} ms</span>
          </div>
          <Progress value={Math.min(100, dbLatency)} />
          <div className="flex items-center justify-between">
            <span>Depolama</span>
            {storageBadge(storage)}
          </div>
          <div className="flex items-center justify-between">
            <span>Çalışma Süresi</span>
            <span className="text-foreground">{formatUptime(uptime)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">API Durumu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <span>Sağlık</span>
            {healthBadge(apiHealth)}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <span>Gecikme</span>
            <span className="text-foreground">{dbLatency} ms</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <span>Depolama</span>
            {storageBadge(storage)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
