"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CaseDetailResponse, CaseStatus } from "@/lib/api/admin/cases";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const statusColors: Record<CaseStatus, string> = {
  opened: "bg-slate-500/20 text-slate-100 border-slate-500/40",
  inspection: "bg-blue-500/20 text-blue-100 border-blue-500/40",
  parts_waiting: "bg-amber-500/20 text-amber-100 border-amber-500/40",
  repairing: "bg-purple-500/20 text-purple-100 border-purple-500/40",
  paint: "bg-pink-500/20 text-pink-100 border-pink-500/40",
  ready: "bg-green-500/20 text-green-100 border-green-500/40",
  delivered: "bg-slate-700/40 text-slate-100 border-slate-600",
};

type Props = {
  data: CaseDetailResponse;
  onChangeStatus: () => void;
};

export function OverviewTab({ data, onChangeStatus }: Props) {
  const lastEvents = useMemo(
    () => data.timeline.slice(0, 5),
    [data.timeline],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="col-span-2">
        <CardHeader className="flex items-center justify-between space-y-0">
          <CardTitle className="text-lg">Dosya Bilgisi</CardTitle>
          <Badge className={cn("border", statusColors[data.case.status])}>
            {data.case.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoItem label="Dosya No" value={data.case.caseNumber || "-"} />
          <InfoItem
            label="Hasar Tarihi"
            value={data.case.damageDate ? format(new Date(data.case.damageDate), "dd.MM.yyyy", { locale: tr }) : "-"}
          />
          <InfoItem label="Eksper" value={data.case.expertName || "-"} />
          <InfoItem label="Telefon" value={data.case.phone || "-"} />
          <InfoItem label="TC/VKN" value={data.case.tcVkn || "-"} />
          <InfoItem label="Notlar" value={data.case.notes || "-"} full />
          <div className="sm:col-span-2 flex justify-end">
            <Button variant="outline" onClick={onChangeStatus}>
              Statü Değiştir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Araç</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <InfoItem label="Plaka" value={data.vehicle.plate} />
          <InfoItem label="Marka" value={data.vehicle.brand || "-"} />
          <InfoItem label="Model" value={data.vehicle.model || "-"} />
          <InfoItem label="Yıl" value={data.vehicle.year ? String(data.vehicle.year) : "-"} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="flex items-center justify-between space-y-0">
          <CardTitle className="text-lg">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {lastEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">Kayıt yok.</p>
            )}
            {lastEvents.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium capitalize">{item.type.replaceAll("_", " ")}</p>
                  {item.data?.notes && (
                    <p className="text-muted-foreground text-xs">{item.data.notes}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={cn("space-y-1", full && "sm:col-span-2")}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="rounded-md border border-border/60 bg-card/50 px-3 py-2 text-sm text-foreground">
        {value}
      </p>
    </div>
  );
}
