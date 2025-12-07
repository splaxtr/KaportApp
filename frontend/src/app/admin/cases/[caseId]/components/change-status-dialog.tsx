"use client";

import { useState } from "react";
import { CaseStatus, updateCaseStatus } from "@/lib/api/admin/cases";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  currentStatus: CaseStatus;
  token: string;
  onSuccess: () => void | Promise<void>;
};

const statuses: CaseStatus[] = [
  "opened",
  "inspection",
  "parts_waiting",
  "repairing",
  "paint",
  "ready",
  "delivered",
];

export function ChangeStatusDialog({
  open,
  onOpenChange,
  caseId,
  currentStatus,
  token,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<CaseStatus>(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await updateCaseStatus(caseId, { status, notes }, token);
    await onSuccess();
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(true)}>
          Statü Değiştir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Statü Güncelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Statü</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as CaseStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Statü seçin" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Not</Label>
            <Textarea
              placeholder="Opsiyonel not"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              İptal
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
