"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { assignShopUsers, getUsers, UserOption } from "@/lib/api/shops";

export function AssignUsersDialog({ shopId, token }: { shopId: string; token: string }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    getUsers(token)
      .then((list) => setUsers((list || []).filter((u) => u.role !== "admin")))
      .catch(() => setUsers([]));
  }, [open, token]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    setLoading(true);
    try {
      await assignShopUsers(shopId, selected, token);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Kullanıcı Ata</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kullanıcı Ata</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Listeden kullanıcı seçin (Admin hariç)</Label>
          <ScrollArea className="h-64 rounded-md border border-border p-2">
            <div className="space-y-2">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
                  <span>{u.name || u.email}</span>
                  <span className="text-xs text-muted-foreground">{u.role}</span>
                </label>
              ))}
              {users.length === 0 && <div className="text-xs text-muted-foreground">Kullanıcı bulunamadı</div>}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={save} disabled={loading}>
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
