"use client";

import Link from "next/link";
import { format } from "date-fns";
import tr from "date-fns/locale/tr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VehicleDetail } from "@/lib/api/admin/vehicle-detail";

const STATUS_COLORS: Record<string, string> = {
  opened: "bg-slate-500/20 text-slate-100",
  inspection: "bg-blue-500/20 text-blue-100",
  parts_waiting: "bg-amber-500/20 text-amber-100",
  repairing: "bg-purple-500/20 text-purple-100",
  paint: "bg-pink-500/20 text-pink-100",
  ready: "bg-emerald-500/20 text-emerald-100",
  delivered: "bg-slate-400/20 text-slate-50",
};

function formatDate(val?: string | null) {
  if (!val) return "—";
  return format(new Date(val), "dd.MM.yyyy", { locale: tr });
}

export default function CaseTable({ cases }: { cases: VehicleDetail["cases"] }) {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Case Listesi</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Case No</TableHead>
              <TableHead>Hasar Tarihi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Oluşturma</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(cases || []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold text-foreground">{c.caseNumber || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.damageDate)}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[c.status || ""] || "bg-muted/40"}>{c.status || "—"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/cases/${c.id}`}>Aç</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {(cases || []).length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">Herhangi bir case bulunamadı.</div>
        )}
      </CardContent>
    </Card>
  );
}
