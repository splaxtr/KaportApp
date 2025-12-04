"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRow, deleteUser } from "@/lib/api/users";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

const PAGE_SIZE = 10;

export function UsersTable({ data, token }: { data: UserRow[]; token: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (data || []).filter((u) => {
      const matchesSearch = `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
      const matchesRole = role === "all" ? true : u.role === role;
      return matchesSearch && matchesRole;
    });
  }, [data, search, role]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteUser(id, token);
      router.refresh();
    } catch {
      // toast placeholder
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="İsim veya e-posta ara"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:max-w-xs"
          />
          <Select
            value={role}
            onValueChange={(val) => {
              setRole(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm roller</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="owner">İşletme Sahibi</SelectItem>
              <SelectItem value="employee">Çalışan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} kullanıcı</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead>Ad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Şube</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.name || "Bilinmiyor"}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.shop?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={u.status === "passive" ? "outline" : "secondary"}>
                    {u.status === "passive" ? "Pasif" : "Aktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10).replaceAll("-", ".") : "-"}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/users/${u.id}`}>Görüntüle</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(u.id)}
                    disabled={busyId === u.id}
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
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Kullanıcı bulunamadı.</div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Sayfa {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Önceki
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
