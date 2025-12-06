"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVehicleCase, getAdminVehicleDetail, VehicleDetail } from "@/lib/api/admin/vehicle-detail";

type Props = {
  vehicleId: string;
  token: string;
  onCreated: (vehicle: VehicleDetail) => void;
};

export default function NewCaseDialog({ vehicleId, token, onCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ownerId: "",
    caseNumber: "",
    damageDate: "",
    expertName: "",
    phone: "",
    tcVkn: "",
    notes: "",
  });

  const submit = async () => {
    if (!form.ownerId) return;
    setLoading(true);
    try {
      await createVehicleCase(vehicleId, { ...form, damageDate: form.damageDate || undefined }, token);
      const fresh = await getAdminVehicleDetail(vehicleId, token);
      onCreated(fresh);
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Case</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Case Oluştur</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>Zorunlu: Owner ID</Label>
            <Input value={form.ownerId} onChange={(e) => setForm((p) => ({ ...p, ownerId: e.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Case No</Label>
              <Input value={form.caseNumber} onChange={(e) => setForm((p) => ({ ...p, caseNumber: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Hasar Tarihi</Label>
              <Input type="date" value={form.damageDate} onChange={(e) => setForm((p) => ({ ...p, damageDate: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Eksper</Label>
              <Input value={form.expertName} onChange={(e) => setForm((p) => ({ ...p, expertName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>TC / VKN</Label>
            <Input value={form.tcVkn} onChange={(e) => setForm((p) => ({ ...p, tcVkn: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Notlar</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={submit} disabled={loading || !form.ownerId}>
            {loading ? "Kaydediliyor..." : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
