"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUser, CreateUserDto } from "@/lib/api/users";
import { getShops, ShopRow } from "@/lib/api/shops";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateUserDialog({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [form, setForm] = useState<CreateUserDto>({
    name: "",
    email: "",
    password: "",
    role: "employee",
    shopId: undefined,
  });

  useEffect(() => {
    if (!open) return;
    getShops(token).then((res) => setShops(res || [])).catch(() => setShops([]));
  }, [open, token]);

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(form, token);
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "employee", shopId: undefined });
      router.refresh();
    } catch {
      // integrate toast if available
    } finally {
      setLoading(false);
    }
  };

  const showShopSelect = form.role === "owner" || form.role === "employee";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Kullanıcı Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kullanıcı Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Ad Soyad</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">E-posta</label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Şifre</label>
            <Input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Rol</label>
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, role: value as "admin" | "owner" | "employee", shopId: prev.shopId }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">İşletme Sahibi</SelectItem>
                <SelectItem value="employee">Çalışan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showShopSelect && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Şube</label>
              <Select
                value={form.shopId || ""}
                onValueChange={(value) => setForm((prev) => ({ ...prev, shopId: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
