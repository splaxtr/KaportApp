"use client";

import { Badge } from "@/components/ui/badge";

type Item = { id: string; message?: string; payload?: any; createdAt: string; actor?: { name?: string } };

export function ActivityTab({ activity }: { activity: Item[] }) {
  if (!activity || activity.length === 0) {
    return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Aktivite yok.</div>;
  }
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {activity.map((a) => (
        <div key={a.id} className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground">{a.message || a.payload?.message || "Aktivite"}</div>
            <Badge variant="outline">{a.actor?.name || "Sistem"}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
