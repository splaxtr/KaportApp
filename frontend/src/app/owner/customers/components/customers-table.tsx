"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CustomerRow, deleteCustomer } from "@/lib/api/customers";
import { CustomerFormDialog } from "./customer-form-dialog";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function CustomersTable({ data, token }: { data: CustomerRow[]; token: string }) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (data || []).filter((c) =>
      `${c.name} ${c.phone ?? ""} ${c.email ?? ""} ${c.tcVkn ?? ""}`.toLowerCase().includes(q)
    );
  }, [data, search]);

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteCustomer(id, token);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Müşteri ara"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <CustomerFormDialog token={token} onSaved={() => router.refresh()} />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>TC/VKN</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-foreground font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{c.email || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{c.tcVkn || "-"}</TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <CustomerFormDialog token={token} initial={c} onSaved={() => router.refresh()} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(c.id)}
                    disabled={busyId === c.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Müşteri bulunamadı.
        </div>
      )}
    </div>
  );
}
