"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateShop } from "@/lib/api/shops";
import { getUsers, UserOption } from "@/lib/api/shops";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EditShopDialog({
  token,
  shop,
}: {
  token: string;
  shop: { id: string; name: string; ownerId?: string };
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(shop.name);
  const [ownerId, setOwnerId] = useState<string>(shop.ownerId || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [owners, setOwners] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!open) return;
    getUsers(token)
      .then((list) => setOwners((list || []).filter((u) => u.role === "owner" || u.role === "employee")))
      .catch(() => setOwners([]));
  }, [open, token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateShop(shop.id, { name, ownerId }, token);
      setOpen(false);
      router.refresh();
    } catch {
      // optionally toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Şubeyi Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Şube Bilgileri</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Şube Adı</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Şube Sahibi</label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Sahip seçin" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full">
                İptal
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
