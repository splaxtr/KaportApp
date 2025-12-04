"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsers } from "@/lib/api/users";
import { transferVehicleOwner } from "@/lib/api/vehicles";

export function TransferOwnerDialog({
  vehicleId,
  token,
  open,
  onOpenChange,
}: {
  vehicleId: string;
  token: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getUsers(token).then((u) => setUsers(u));
  }, [open, token]);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await transferVehicleOwner(vehicleId, selected, token);
      onOpenChange(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sahip Değiştir</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={selected} onValueChange={(v) => setSelected(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Kullanıcı seçin" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={submit} disabled={!selected || saving}>
            {saving ? "Kaydediliyor..." : "Devret"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
