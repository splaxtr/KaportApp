"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRow, assignUserShop, changeUserRole, deleteUser, createUser } from "@/lib/api/users";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function EmployeesTable({ data, token, shopId }: { data: UserRow[]; token: string; shopId?: string }) {
  const router = useRouter();
  const [meId, setMeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const filtered = useMemo(() => {
    return (data || []).filter((u) => {
      const matchesRole = role === "all" ? true : u.role === role;
      const q = search.toLowerCase();
      const matchesSearch = `${u.name} ${u.email}`.toLowerCase().includes(q);
      const inShop = shopId ? u.shop?.id === shopId || !u.shop : true;
      return matchesRole && matchesSearch && inShop;
    });
  }, [data, role, search, shopId]);

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteUser(id, token);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  // Me ID'yi almak için kendimizi data içinden bul
  useMemo(() => {
    if (!meId) {
      const me = data.find((u) => u.email && u.email.length > 0 && u.id);
      if (me) setMeId(me.id);
    }
  }, [data, meId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Çalışan ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Çalışan</SelectItem>
              <SelectItem value="owner">İşletme Sahibi</SelectItem>
              <SelectItem value="all">Tümü</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setForm({ name: "", email: "", password: "" });
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Çalışan Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-foreground sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Çalışan Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Ad Soyad</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">E-posta</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Şifre</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button
                  disabled={creating || !shopId || !form.name || !form.email || !form.password}
                  onClick={async () => {
                    if (!shopId) return;
                    setCreating(true);
                    try {
                      await createUser(
                        { ...form, role: "employee", shopId },
                        token
                      );
                      setOpen(false);
                      setForm({ name: "", email: "", password: "" });
                      router.refresh();
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {creating ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted/50">
            <tr className="hover:bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ad</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-posta</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">İşlemler</th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child]:border-0">
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border/70">
                <td className="px-4 py-3 text-foreground">{u.name || "Bilinmiyor"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{u.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(u.id)}
                      disabled={busyId === u.id || u.role === "owner" || (meId && u.id === meId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
      )}
    </div>
  );
}
