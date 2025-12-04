"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VehicleRow, editVehicle } from "@/lib/api/vehicles";
import { Car, ClipboardList, Image as ImageIcon, User2 } from "lucide-react";
import { VehicleOwnerSection } from "./vehicle-owner-section";

export function VehicleOverview({ vehicle, token }: { vehicle: VehicleRow; token: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plate: vehicle.plate,
    brand: vehicle.brand || "",
    model: vehicle.model || "",
    year: vehicle.year ? String(vehicle.year) : "",
    package: vehicle.package || "",
    notes: vehicle.notes || "",
  });

  const fullName = useMemo(
    () => [form.brand, form.model, form.year, form.package].filter(Boolean).join(" "),
    [form.brand, form.model, form.year, form.package]
  );

  const save = async () => {
    setSaving(true);
    try {
          await editVehicle(
            vehicle.id,
            {
              plate: form.plate,
              brand: form.brand,
              model: form.model,
              year: form.year ? Number(form.year) : undefined,
              package: form.package,
              notes: form.notes,
            },
            token
          );
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground">Özet</CardTitle>
            <div className="text-sm text-muted-foreground">Plaka ve araç detayları</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing((p) => !p)}>
              {editing ? "Vazgeç" : "Düzenle"}
            </Button>
            {editing && (
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Plaka">
            {editing ? (
              <Input value={form.plate} onChange={(e) => setForm((p) => ({ ...p, plate: e.target.value }))} />
            ) : (
              <span className="text-lg font-semibold text-foreground">{form.plate}</span>
            )}
          </Field>
          <Field label="Araç">
            {editing ? (
              <Input
                value={fullName}
                placeholder="Toyota Corolla 2025 Comfort"
                onChange={(e) => {
                  const parts = e.target.value.split(" ");
                  const [brand = "", model = "", year = ""] = parts;
                  setForm((p) => ({ ...p, brand, model, year, package: parts.slice(3).join(" ") }));
                }}
              />
            ) : (
              <div className="flex items-center gap-2 text-foreground">
                <Car className="h-4 w-4 text-muted-foreground" />
                {fullName || "-"}
              </div>
            )}
          </Field>
          <Field label="Paket / Donanım">
            {editing ? (
              <Input value={form.package} onChange={(e) => setForm((p) => ({ ...p, package: e.target.value }))} />
            ) : (
              form.package || "-"
            )}
          </Field>
          <Field label="Notlar" className="md:col-span-2">
            {editing ? (
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            ) : (
              form.notes || "-"
            )}
          </Field>
          <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
            <Metric icon={<ClipboardList className="h-4 w-4" />} label="Parça" value={vehicle._count?.parts ?? 0} />
            <Metric icon={<ImageIcon className="h-4 w-4" />} label="Fotoğraf" value={vehicle._count?.photos ?? 0} />
            <Metric icon={<User2 className="h-4 w-4" />} label="Sahip" value={vehicle.currentOwner?.name || "Atanmamış"} />
          </div>
          <Separator className="md:col-span-2 opacity-40" />
          <div className="text-xs text-muted-foreground md:col-span-2">
            Oluşturma: {vehicle.createdAt ? new Date(vehicle.createdAt).toISOString() : "-"} · Güncelleme:{" "}
            {vehicle.updatedAt ? new Date(vehicle.updatedAt).toISOString() : "-"}
          </div>
        </CardContent>
      </Card>

      <VehicleOwnerSection vehicle={vehicle} token={token} />
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border/60 bg-muted/20 p-3 ${className || ""}`}>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
