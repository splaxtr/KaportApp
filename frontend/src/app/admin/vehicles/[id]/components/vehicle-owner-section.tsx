"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCircle2 } from "lucide-react";
import { VehicleRow } from "@/lib/api/vehicles";
import { TransferOwnerDialog } from "./transfer-owner-dialog";

export function VehicleOwnerSection({ vehicle, token }: { vehicle: VehicleRow; token: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Sahiplik</CardTitle>
          <div className="text-sm text-muted-foreground">Güncel sahip ve devir işlemleri</div>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Sahip Değiştir
        </Button>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-10 w-10 text-muted-foreground" />
          <div>
            <div className="text-sm font-semibold text-foreground">{vehicle.currentOwner?.name || "Atanmamış"}</div>
            <div className="text-xs text-muted-foreground">{vehicle.currentOwner?.email || vehicle.currentOwner?.phone || "—"}</div>
          </div>
        </div>
        <Badge variant="outline">{vehicle.currentOwner ? "Aktif" : "Atanmamış"}</Badge>
      </CardContent>
      <TransferOwnerDialog vehicleId={vehicle.id} open={open} onOpenChange={setOpen} token={token} />
    </Card>
  );
}
