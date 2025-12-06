"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, RefreshCw, Search, Trash2 } from "lucide-react";
import { VehicleRow, deleteVehicleScoped } from "@/lib/api/vehicles";
import { VehicleFormDialog } from "./vehicle-form-dialog";
import { useRouter } from "next/navigation";

export function VehiclesClient({ vehicles, token, shopId }: { vehicles: VehicleRow[]; token: string; shopId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toISOString().slice(0, 10);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.plate.toLowerCase().includes(q) ||
        (v.brand || "").toLowerCase().includes(q) ||
        (v.model || "").toLowerCase().includes(q) ||
        (v.package || "").toLowerCase().includes(q)
    );
  }, [vehicles, query]);

  const activeVehicles = useMemo(
    () => filtered.filter((v) => (v.cases?.[0]?.status || "pending") !== "completed"),
    [filtered]
  );
  const completedVehicles = useMemo(
    () => filtered.filter((v) => (v.cases?.[0]?.status || "pending") === "completed"),
    [filtered]
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Araçlar</h1>
          <p className="text-sm text-muted-foreground">Şubenize ait araçları listeleyin, arayın ve düzenleyin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={isPending}
            onClick={() => startTransition(() => router.refresh())}
            aria-label="Yenile"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <VehicleFormDialog token={token} shopId={shopId} />
        </div>
      </header>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Plaka / marka / model ara"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Araç listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="active">Aktif</TabsTrigger>
              <TabsTrigger value="completed">Tamamlananlar</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="p-0">
              {activeVehicles.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Aktif araç bulunamadı.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plaka</TableHead>
                      <TableHead>Marka / Model / Paket</TableHead>
                      <TableHead>Dosya</TableHead>
                      <TableHead>Kaza</TableHead>
                      <TableHead>Sahip</TableHead>
                      <TableHead>Oluşturma</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeVehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-semibold text-foreground">{v.plate}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {v.brand || "-"} {v.model || ""} {v.year ? `(${v.year})` : ""} {v.package ? `• ${v.package}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{v.cases?.[0]?.caseNumber || "-"}</TableCell>
                        <TableCell className="text-foreground">
                          {formatDate(v.cases?.[0]?.damageDate as string | undefined)}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {v.currentOwner?.name || "-"}{" "}
                          {v.currentOwner?.phone ? (
                            <span className="text-xs text-muted-foreground">({v.currentOwner.phone})</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-foreground">{formatDate(v.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/owner/vehicles/${v.id}`}>Görüntüle</Link>
                        </Button>
                        <VehicleFormDialog token={token} shopId={shopId} initial={v} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={busyId === v.id}
                          onClick={() =>
                            startTransition(async () => {
                              setBusyId(v.id);
                              try {
                                await deleteVehicleScoped(v.id, token);
                                router.refresh();
                              } finally {
                                setBusyId(null);
                              }
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="completed" className="p-0">
              {completedVehicles.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Tamamlanan araç yok.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plaka</TableHead>
                      <TableHead>Marka / Model / Paket</TableHead>
                      <TableHead>Dosya</TableHead>
                      <TableHead>Kaza</TableHead>
                      <TableHead>Sahip</TableHead>
                      <TableHead>Oluşturma</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedVehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-semibold text-foreground">{v.plate}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {v.brand || "-"} {v.model || ""} {v.year ? `(${v.year})` : ""} {v.package ? `• ${v.package}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{v.cases?.[0]?.caseNumber || "-"}</TableCell>
                        <TableCell className="text-foreground">
                          {formatDate(v.cases?.[0]?.damageDate as string | undefined)}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {v.currentOwner?.name || "-"}{" "}
                          {v.currentOwner?.phone ? (
                            <span className="text-xs text-muted-foreground">({v.currentOwner.phone})</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-foreground">{formatDate(v.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild size="sm" variant="secondary">
                              <Link href={`/owner/vehicles/${v.id}`}>Görüntüle</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
