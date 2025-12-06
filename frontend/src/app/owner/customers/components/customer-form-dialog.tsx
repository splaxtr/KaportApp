"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCustomer, updateCustomer, CustomerRow } from "@/lib/api/customers";

export function CustomerFormDialog({
  token,
  initial,
  onSaved,
}: {
  token: string;
  initial?: CustomerRow | null;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    tcVkn: initial?.tcVkn || "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) {
        await updateCustomer(initial.id, form, token);
      } else {
        await createCustomer({ name: form.name, phone: form.phone, email: form.email, tcVkn: form.tcVkn }, token);
      }
      setOpen(false);
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" variant={initial ? "outline" : "default"}>
          {initial ? "Düzenle" : "Müşteri Ekle"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Müşteri Düzenle" : "Yeni Müşteri"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Ad Soyad</label>
            <Input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Telefon</label>
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">E-posta</label>
            <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">TC/VKN</label>
            <Input value={form.tcVkn} onChange={(e) => setForm((p) => ({ ...p, tcVkn: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
