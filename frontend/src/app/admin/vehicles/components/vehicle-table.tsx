"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import tr from "date-fns/locale/tr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VehicleListItem } from "@/lib/api/admin/vehicles";

const STATUS_COLORS: Record<string, string> = {
  opened: "bg-slate-500/20 text-slate-100",
  inspection: "bg-blue-500/20 text-blue-100",
  parts_waiting: "bg-amber-500/20 text-amber-100",
  repairing: "bg-purple-500/20 text-purple-100",
  paint: "bg-pink-500/20 text-pink-100",
  ready: "bg-emerald-500/20 text-emerald-100",
  delivered: "bg-slate-400/20 text-slate-50",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return format(d, "dd.MM.yyyy", { locale: tr });
}

type SortKey = "plate" | "createdAt";
type SortDir = "asc" | "desc";

export function VehicleTable({ initialData }: { initialData: VehicleListItem[] }) {
  const [data, setData] = useState<VehicleListItem[]>(initialData);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [data]);

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const av = sortKey === "plate" ? a.plate : a.createdAt || "";
      const bv = sortKey === "plate" ? b.plate : b.createdAt || "";
      if (av === bv) return 0;
      return sortDir === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
    return copy;
  }, [data, sortDir, sortKey]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const lastCase = (v: VehicleListItem) => {
    if (!v.cases || v.cases.length === 0) return null;
    return [...v.cases].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")).pop()!;
  };

  const statusBadge = (status?: string | null) => {
    if (!status) return <Badge variant="outline">—</Badge>;
    return <Badge className={STATUS_COLORS[status] || "bg-muted/40"}>{status}</Badge>;
  };

  const changePage = (dir: number) => {
    setPage((p) => Math.max(1, Math.min(Math.ceil(sorted.length / pageSize) || 1, p + dir)));
  };

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("plate")}>
                Plaka
              </TableHead>
              <TableHead>Marka / Model</TableHead>
              <TableHead>Yıl</TableHead>
              <TableHead>Sahip</TableHead>
              <TableHead>Son Case Statüsü</TableHead>
              <TableHead>Son Hasar Tarihi</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                Oluşturma
              </TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((v) => {
              const lc = lastCase(v);
              return (
                <TableRow key={v.id} className="hover:bg-muted/20">
                  <TableCell className="font-semibold text-foreground">{v.plate}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.brand || "—"} {v.model || ""} {v.year ? `· ${v.year}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.year || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{v.currentOwnerId || "—"}</TableCell>
                  <TableCell>{statusBadge(lc?.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(lc?.damageDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/vehicles/${v.id}`}>Aç</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {sorted.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">Araç bulunamadı.</div>
        )}
        {sorted.length > pageSize && (
          <div className="flex items-center justify-between border-t border-border p-3 text-sm text-muted-foreground">
            <div>
              Sayfa {page} / {Math.max(1, Math.ceil(sorted.length / pageSize))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => changePage(-1)} disabled={page === 1}>
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(1)}
                disabled={page >= Math.ceil(sorted.length / pageSize)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
