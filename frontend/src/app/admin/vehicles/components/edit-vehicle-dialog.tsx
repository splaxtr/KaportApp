"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { editVehicle, VehicleRow } from "@/lib/api/vehicles";
import { getShops, ShopRow } from "@/lib/api/shops";
import { useRouter } from "next/navigation";

export function EditVehicleDialog({
  token,
  vehicle,
  onSaved,
}: {
  token: string;
  vehicle: VehicleRow;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [brands, setBrands] = useState<{ name: string }[]>([]);
  const [models, setModels] = useState<{ name: string }[]>([]);
  const [years, setYears] = useState<{ year: number }[]>([]);
  const [packages, setPackages] = useState<{ name: string }[]>([]);
  const [form, setForm] = useState({
    plate: vehicle.plate,
    brand: vehicle.brand || "",
    model: vehicle.model || "",
    year: vehicle.year ? String(vehicle.year) : "",
    package: vehicle.package || "",
    shopId: vehicle.shop?.id || "",
    notes: vehicle.notes || "",
  });
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    getShops(token).then((res) => setShops(res || [])).catch(() => setShops([]));
    // Skip external catalog fetches to avoid UI freeze; rely on existing value + manual input.
    setBrands(form.brand ? [{ name: form.brand }] : []);
    setModels(form.model ? [{ name: form.model }] : []);
    setYears(form.year ? [{ year: Number(form.year) }] : []);
    setPackages(form.package ? [{ name: form.package }] : []);
  }, [open, token, form.brand, form.model, form.year, form.package]);

  const brandOptions = useMemo(() => {
    const list = [...brands];
    if (form.brand && !list.find((b) => b.name === form.brand)) list.unshift({ name: form.brand });
    return list;
  }, [brands, form.brand]);
  const modelOptions = useMemo(() => {
    const list = [...models];
    if (form.model && !list.find((m) => m.name === form.model)) list.unshift({ name: form.model });
    return list;
  }, [models, form.model]);
  const yearOptions = useMemo(() => {
    const list = [...years];
    if (form.year) {
      const y = Number(form.year);
      if (!Number.isNaN(y) && !list.find((i) => i.year === y)) list.unshift({ year: y });
    }
    return list;
  }, [years, form.year]);
  const packageOptions = useMemo(() => {
    const list = [...packages];
    if (form.package && !list.find((p) => p.name === form.package)) list.unshift({ name: form.package });
    return list;
  }, [packages, form.package]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
          await editVehicle(
            vehicle.id,
            {
              plate: form.plate,
              brand: form.brand,
              model: form.model,
              year: form.year ? Number(form.year) : undefined,
              package: form.package,
              shopId: form.shopId || undefined,
              notes: form.notes,
            },
            token
          );
      setOpen(false);
      onSaved();
      router.refresh();
    } catch {
      // toast placeholder
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Plate</label>
              <Input value={form.plate} onChange={(e) => setForm((p) => ({ ...p, plate: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Brand</label>
              <Select
                value={form.brand || "_custom_"}
                onValueChange={(val) => setForm((p) => ({ ...p, brand: val === "_custom_" ? "" : val, model: "", year: "", package: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_custom_">Custom / manual</SelectItem>
                  {brandOptions.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type brand"
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value, model: "", year: "", package: "" }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Model</label>
              <Select
                value={form.model || "_custom_"}
                onValueChange={(val) => setForm((p) => ({ ...p, model: val === "_custom_" ? "" : val, year: "", package: "" }))}
                disabled={!form.brand}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_custom_">Custom / manual</SelectItem>
                  {modelOptions.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type model"
                value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value, year: "", package: "" }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Year</label>
              <Select
                value={form.year || "_custom_"}
                onValueChange={(val) => setForm((p) => ({ ...p, year: val === "_custom_" ? "" : val, package: "" }))}
                disabled={!form.model}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_custom_">Custom / manual</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y.year} value={String(y.year)}>
                      {y.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type year"
                type="number"
                value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Package / Trim</label>
              <Select
                value={form.package || "_custom_"}
                onValueChange={(val) => setForm((p) => ({ ...p, package: val === "_custom_" ? "" : val }))}
                disabled={!form.year && !form.model}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_custom_">Custom / manual entry</SelectItem>
                  {packageOptions.map((pkg) => (
                    <SelectItem key={pkg.name} value={pkg.name}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type custom package"
                value={form.package}
                onChange={(e) => setForm((p) => ({ ...p, package: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Shop</label>
              <Select value={form.shopId} onValueChange={(val) => setForm((p) => ({ ...p, shopId: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button" className="w-full">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
