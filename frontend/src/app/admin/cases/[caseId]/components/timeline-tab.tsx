"use client";

import { useEffect, useState } from "react";
import { getCaseTimeline, TimelineItem } from "@/lib/api/admin/cases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as ImageIcon, Info, List, RefreshCw, Wrench, Clock3, PaintBucket } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Props = {
  caseId: string;
  initialTimeline: TimelineItem[];
  token: string;
};

export function TimelineTab({ caseId, initialTimeline, token }: Props) {
  const [items, setItems] = useState<TimelineItem[]>(initialTimeline);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await getCaseTimeline(caseId, token);
    setItems(res);
    setLoading(false);
  }

  useEffect(() => {
    setItems(initialTimeline);
  }, [initialTimeline]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle>Aktivite Geçmişi</CardTitle>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Yenile
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px]">
          <div className="space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Henüz kayıt yok.</p>
            )}
            {items.map((item, idx) => (
              <TimelineRow key={idx} item={item} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const icon = (() => {
    if (item.type === "status") return <RefreshCw className="h-4 w-4 text-blue-400" />;
    if (item.type?.includes("photo")) return <ImageIcon className="h-4 w-4 text-pink-400" />;
    if (item.type?.includes("part")) return <Wrench className="h-4 w-4 text-amber-400" />;
    if (item.type?.includes("operation")) return <List className="h-4 w-4 text-purple-400" />;
    if (item.type?.includes("paint")) return <PaintBucket className="h-4 w-4 text-rose-400" />;
    return <Info className="h-4 w-4 text-slate-400" />;
  })();

  const title = item.type?.replaceAll("_", " ") || "Kayıt";
  const timestamp = item.createdAt
    ? format(new Date(item.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })
    : "-";

  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 bg-card/60 p-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium capitalize">{title}</p>
          {item.data?.status && (
            <Badge variant="outline" className="text-xs">
              {item.data.status}
            </Badge>
          )}
        </div>
        {item.data?.notes && (
          <p className="text-sm text-muted-foreground">{item.data.notes}</p>
        )}
        {item.data?.description && (
          <p className="text-sm text-muted-foreground">{item.data.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-3 w-3" />
          <span>{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
