"use client";

import { Badge } from "@/components/ui/badge";
import { VehicleDetail } from "@/lib/api/admin/vehicle-detail";
import { format } from "date-fns";
import tr from "date-fns/locale/tr";

function formatDate(val?: string | null) {
  if (!val) return "—";
  return format(new Date(val), "dd.MM.yyyy", { locale: tr });
}

export default function VehicleHeader({ vehicle }: { vehicle: VehicleDetail }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xl font-semibold text-foreground">{vehicle.plate}</span>
        <Badge variant="outline">{vehicle.brand || "—"}</Badge>
        {vehicle.model && <Badge variant="secondary">{vehicle.model}</Badge>}
        {vehicle.year && <Badge variant="outline">{vehicle.year}</Badge>}
      </div>
      <div className="text-sm text-muted-foreground">
        Oluşturma: {formatDate(vehicle.createdAt)} • Sahip: {vehicle.currentOwnerId || "—"}
      </div>
    </div>
  );
}
