"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserRow, assignUserShop, changeUserRole, updateUser } from "@/lib/api/users";
import { getShops, ShopRow } from "@/lib/api/shops";

export function UserRoles({ user, token, shops: initialShops }: { user: UserRow; token: string; shops: ShopRow[] }) {
  const [role, setRole] = useState<UserRow["role"]>(user.role);
  const [status, setStatus] = useState<"active" | "passive">(user.status === "passive" ? "passive" : "active");
  const [shopId, setShopId] = useState<string | "_none_">(user.shop?.id || "_none_");
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<ShopRow[]>(initialShops || []);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (initialShops?.length) return;
    getShops(token).then(setShops).catch(() => setShops([]));
  }, [initialShops, token]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (role !== user.role) {
        await changeUserRole(user.id, role, token);
      }
      const resolved = shopId === "_none_" ? null : shopId;
      await assignUserShop(user.id, resolved, token);
      await updateUser(
        user.id,
        { status, password: newPassword ? newPassword : undefined },
        token
      );
      if (newPassword) setNewPassword("");
    } catch {
      // toast placeholder
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Rol ve Yetkiler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Rol</label>
            <Select value={role} onValueChange={(val) => setRole(val as UserRow["role"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Yönetici</SelectItem>
                <SelectItem value="owner">İşletme Sahibi</SelectItem>
                <SelectItem value="employee">Çalışan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Durum</label>
            <Select value={status} onValueChange={(val) => setStatus(val as "active" | "passive") }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="passive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Bağlı Olduğu İşletme</label>
          <Select value={shopId} onValueChange={(val) => setShopId(val)}>
            <SelectTrigger>
              <SelectValue placeholder="İşletme seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none_">Atanmamış</SelectItem>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Yeni Şifre (opsiyonel)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Yeni şifre belirle"
          />
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={status === "active" ? "secondary" : "outline"}>{status === "active" ? "Aktif" : "Pasif"}</Badge>
          <span className="text-sm text-muted-foreground">Rol: {role}</span>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
}
