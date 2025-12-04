"use client";

import { Button } from "@/components/ui/button";
import { Car, MapPin, ShieldCheck } from "lucide-react";
import { VehicleRow } from "@/lib/api/vehicles";

export function VehicleHeader({ vehicle }: { vehicle: VehicleRow; token?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Car className="h-5 w-5 text-muted-foreground" />
          {vehicle.plate}
        </div>
        <div className="text-sm text-muted-foreground">
          {vehicle.brand || "-"} {vehicle.model || ""} {vehicle.year ? `(${vehicle.year})` : ""}{" "}
          {vehicle.package ? `· ${vehicle.package}` : ""}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {vehicle.shop?.name || "Şube yok"}
          <ShieldCheck className="h-3 w-3 ml-2" />
          {vehicle._count ? `${vehicle._count.parts || 0} parça · ${vehicle._count.photos || 0} fotoğraf` : "-"}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Dışa Aktar
        </Button>
      </div>
    </div>
  );
}
