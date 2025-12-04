"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteVehicle, getVehicles, VehicleFilters, VehicleRow } from "@/lib/api/vehicles";
import { useRouter } from "next/navigation";

export function VehiclesTable({ initialData, token }: { initialData: VehicleRow[]; token: string }) {
  const router = useRouter();
  const [data, setData] = useState<VehicleRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.filter((v) => {
      const matchesSearch =
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        `${v.brand || ""} ${v.model || ""}`.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [data, search]);

  const handleRefresh = async () => {
    const fresh = await getVehicles(token);
    setData(fresh);
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteVehicle(id, token);
      await handleRefresh();
      router.refresh();
    } catch {
      // TODO toast
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (val?: string | null) => (val ? new Date(val).toISOString().slice(0, 10) : "-");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Plaka / marka / model ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          Yenile
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Plaka</TableHead>
              <TableHead>Marka / Model / Yıl / Paket</TableHead>
              <TableHead>Şube</TableHead>
              <TableHead>Oluşturma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-semibold text-foreground">{v.plate}</TableCell>
                <TableCell className="text-muted-foreground">
                  {v.brand || "-"} {v.model || ""} {v.year ? `(${v.year})` : ""} {v.package ? `· ${v.package}` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{v.shop?.name || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(v.createdAt)}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/vehicles/${v.id}`}>Görüntüle</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={busyId === v.id}
                    onClick={() => handleDelete(v.id)}
                  >
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Araç bulunamadı.</div>
      )}
    </div>
  );
}
