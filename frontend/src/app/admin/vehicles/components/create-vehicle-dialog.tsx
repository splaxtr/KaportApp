"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVehicleAdmin } from "@/lib/api/admin/vehicles";
import { Loader2, Plus } from "lucide-react";

type Props = {
  token: string;
  onCreated: () => Promise<void>;
};

export function CreateVehicleDialog({ token, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopId: "demo-shop-id",
    plate: "",
    brand: "",
    model: "",
    year: "",
    ownerId: "",
    caseNumber: "",
    damageDate: "",
    expertName: "",
    phone: "",
    tcVkn: "",
    notes: "",
  });

  const submit = async () => {
    setLoading(true);
    await createVehicleAdmin(
      {
        shopId: form.shopId,
        plate: form.plate,
        brand: form.brand || undefined,
        model: form.model || undefined,
        year: form.year ? Number(form.year) : undefined,
        ownerId: form.ownerId,
        caseNumber: form.caseNumber || undefined,
        damageDate: form.damageDate || undefined,
        expertName: form.expertName || undefined,
        phone: form.phone || undefined,
        tcVkn: form.tcVkn || undefined,
        notes: form.notes || undefined,
      },
      token,
    );
    await onCreated();
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Araç Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Yeni Araç + Dosya</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Plaka" required>
            <Input
              value={form.plate}
              onChange={(e) => setForm((p) => ({ ...p, plate: e.target.value.toUpperCase() }))}
              placeholder="34ABC123"
            />
          </Field>
          <Field label="Şube ID">
            <Input value={form.shopId} onChange={(e) => setForm((p) => ({ ...p, shopId: e.target.value }))} />
          </Field>
          <Field label="Marka">
            <Input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
          </Field>
          <Field label="Model">
            <Input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} />
          </Field>
          <Field label="Yıl">
            <Input
              type="number"
              inputMode="numeric"
              value={form.year}
              onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
            />
          </Field>
          <Field label="Sahip (Customer ID)" required>
            <Input value={form.ownerId} onChange={(e) => setForm((p) => ({ ...p, ownerId: e.target.value }))} />
          </Field>
          <Field label="Dosya No">
            <Input value={form.caseNumber} onChange={(e) => setForm((p) => ({ ...p, caseNumber: e.target.value }))} />
          </Field>
          <Field label="Hasar Tarihi">
            <Input
              type="date"
              value={form.damageDate}
              onChange={(e) => setForm((p) => ({ ...p, damageDate: e.target.value }))}
            />
          </Field>
          <Field label="Eksper">
            <Input
              value={form.expertName}
              onChange={(e) => setForm((p) => ({ ...p, expertName: e.target.value }))}
            />
          </Field>
          <Field label="Telefon">
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </Field>
          <Field label="TC/VKN">
            <Input value={form.tcVkn} onChange={(e) => setForm((p) => ({ ...p, tcVkn: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2 space-y-2">
            <Label>Notlar</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Opsiyonel not"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            İptal
          </Button>
          <Button
            onClick={submit}
            disabled={loading || !form.plate.trim() || !form.ownerId.trim() || !form.shopId.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
