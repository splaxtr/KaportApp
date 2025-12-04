"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VehicleRow } from "@/lib/api/vehicles";

export function OwnerHistoryTab({ vehicle }: { vehicle: VehicleRow }) {
  const history = [...(vehicle.ownerHistory || [])].sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  );
  if (history.length === 0) {
    return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Kayıt yok.</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Sahip</TableHead>
            <TableHead>Atandı</TableHead>
            <TableHead>Çıkış</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="font-medium text-foreground">
                {h.owner?.name || h.ownerId}{" "}
                <span className="text-xs text-muted-foreground">{h.owner?.email ? `(${h.owner.email})` : ""}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(h.assignedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {h.releasedAt ? (
                  new Date(h.releasedAt).toLocaleDateString()
                ) : (
                  <Badge variant="outline">Aktif</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
