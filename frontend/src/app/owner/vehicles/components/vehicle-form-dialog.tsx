"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVehicleScoped, updateVehicleScoped, VehicleRow } from "@/lib/api/vehicles";
import { getCustomers, CustomerRow, createCustomer } from "@/lib/api/customers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  shopId: string;
  initial?: VehicleRow | null;
};

export function VehicleFormDialog({ token, shopId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    tcVkn: "",
  });
  const [form, setForm] = useState({
    plate: initial?.plate || "",
    vehicleModel: [initial?.brand, initial?.model, initial?.year, initial?.package]
      .filter(Boolean)
      .join(" ")
      .trim(),
    customerId: initial?.currentOwnerId || "",
    fileNo: initial?.cases?.[0]?.caseNumber || "",
    damageDate: initial?.cases?.[0]?.damageDate
      ? new Date(initial.cases[0].damageDate as string).toISOString().slice(0, 10)
      : "",
    year: initial?.year ? String(initial.year) : "",
    package: initial?.package || "",
    notes: initial?.notes || "",
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    const list = await getCustomers(token);
    setCustomers(list || []);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError(null);
      // basit ayrıştırma: ilk kelime marka, kalan model; yıl/paket çıkarılamazsa boş kalır
      const trimmed = form.vehicleModel.trim();
      const [brand, ...rest] = trimmed.split(" ");
      const model = rest.join(" ").trim();
      if (!brand || !model) {
        setError("Araç modeli (Marka/Model/...) alanı geçerli değil.");
        setLoading(false);
        return;
      }
      if (!form.customerId) {
        setError("Müşteri seçmek zorunludur.");
        setLoading(false);
        return;
      }
      const payload = {
        plate: form.plate,
        brand: brand || "",
        model: model || "",
        year: form.year ? Number(form.year) : undefined,
        package: form.package || undefined,
        notes: form.notes || undefined,
        ownerId: form.customerId,
        caseNumber: form.fileNo || undefined,
        damageDate: form.damageDate || undefined,
        shopId,
      };

      if (!payload.ownerId) throw new Error("customer required");

      if (initial?.id) {
        await updateVehicleScoped(initial.id, payload, token);
      } else {
        await createVehicleScoped(payload, token);
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const saveCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    setLoading(true);
    try {
      const created = await createCustomer(
        {
          name: newCustomer.name,
          phone: newCustomer.phone || undefined,
          email: newCustomer.email || undefined,
          tcVkn: newCustomer.tcVkn || undefined,
        },
        token
      );
      await load();
      setForm((p) => ({ ...p, customerId: created.id }));
      setAddingCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "", tcVkn: "" });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2"
          variant={initial ? "outline" : "default"}
          onClick={() => {
            setOpen(true);
            load();
          }}
        >
          {initial ? "Düzenle" : "Araç Ekle"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Aracı Düzenle" : "Yeni Araç Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Plaka</label>
            <Input
              required
              value={form.plate}
              onChange={(e) => setForm((p) => ({ ...p, plate: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Araç modeli (Marka/Model/Yıl/Paket)</label>
            <Input
              required
              value={form.vehicleModel}
              onChange={(e) => setForm((p) => ({ ...p, vehicleModel: e.target.value }))}
              placeholder="Örn: Toyota Corolla 2020 Comfort"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Müşteri (zorunlu)</label>
            <div className="space-y-2">
              <Select
                value={form.customerId}
                onValueChange={(val) => setForm((p) => ({ ...p, customerId: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Ara..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  {filteredCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `- ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Aradığınız yoksa ekleyin</span>
                <Button type="button" size="sm" variant="outline" onClick={() => setAddingCustomer((v) => !v)}>
                  {addingCustomer ? "Vazgeç" : "Yeni Müşteri"}
                </Button>
              </div>
              {addingCustomer && (
                <div className="grid gap-2 rounded-lg border border-border p-3">
                  <Input
                    placeholder="Ad Soyad *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Telefon"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <Input
                    placeholder="E-posta"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Input
                    placeholder="TC/VKN"
                    value={newCustomer.tcVkn}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, tcVkn: e.target.value }))}
                  />
                  <Button type="button" size="sm" onClick={saveCustomer} disabled={loading}>
                    Kaydet
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Dosya Numarası (opsiyonel)</label>
              <Input
                value={form.fileNo}
                onChange={(e) => setForm((p) => ({ ...p, fileNo: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Kaza Tarihi</label>
              <Input
                type="date"
                value={form.damageDate}
                onChange={(e) => setForm((p) => ({ ...p, damageDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Notlar</label>
            <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
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
