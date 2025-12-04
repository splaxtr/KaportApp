"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShopRow } from "@/lib/api/shops";

export function ShopsTable({ data, loading }: { data: ShopRow[]; loading?: boolean }) {
  if (loading) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">Şubeler yükleniyor...</CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">Şube bulunamadı.</CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Şube Adı</th>
            <th className="px-4 py-3 text-left font-medium">Sahip</th>
            <th className="px-4 py-3 text-left font-medium">Kullanıcı</th>
            <th className="px-4 py-3 text-left font-medium">Araç</th>
            <th className="px-4 py-3 text-left font-medium">Durum</th>
            <th className="px-4 py-3 text-left font-medium">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {data.map((shop) => (
            <tr key={shop.id} className="border-t border-border/60">
              <td className="px-4 py-3 text-foreground">{shop.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {shop.owner?.name || shop.owner?.email || "Bilinmiyor"}
              </td>
              <td className="px-4 py-3 text-foreground">{shop.usersCount ?? 0}</td>
              <td className="px-4 py-3 text-foreground">{shop.vehiclesCount ?? 0}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={shop.status === "active" ? "text-emerald-300" : "text-amber-300"}>
                  {shop.status === "passive" ? "Pasif" : "Aktif"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/shops/${shop.id}`}>Görüntüle</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
