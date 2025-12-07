"use client";

import { useMemo, useState } from "react";
import {
  CaseOperation,
  createCaseOperation,
  deleteCaseOperation,
  updateCaseOperation,
} from "@/lib/api/admin/cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, Pencil, Plus, Trash } from "lucide-react";

type Props = {
  caseId: string;
  operations: CaseOperation[];
  token: string;
  onRefresh: () => Promise<void>;
};

export function OperationsTab({ caseId, operations, token, onRefresh }: Props) {
  const [openOp, setOpenOp] = useState<CaseOperation | null>(null);
  const [saving, setSaving] = useState(false);

  const ordered = useMemo(
    () => [...operations].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [operations],
  );

  const totalCost = useMemo(
    () => ordered.reduce((sum, op) => sum + (op.cost || 0), 0),
    [ordered],
  );

  async function handleDelete(id: string) {
    setSaving(true);
    await deleteCaseOperation(id, token);
    await onRefresh();
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle>Operasyonlar</CardTitle>
        <Dialog open={!!openOp} onOpenChange={(o) => !o && setOpenOp(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setOpenOp({ id: "", caseId, description: "" })}>
              <Plus className="mr-2 h-4 w-4" />
              Operasyon Ekle
            </Button>
          </DialogTrigger>
          {openOp && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{openOp.id ? "Operasyon Düzenle" : "Yeni Operasyon"}</DialogTitle>
              </DialogHeader>
              <OperationForm
                op={openOp}
                caseId={caseId}
                token={token}
                onSaved={onRefresh}
                onClose={() => setOpenOp(null)}
              />
            </DialogContent>
          )}
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Açıklama</TableHead>
                <TableHead>Süre (saat)</TableHead>
                <TableHead>Maliyet</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="w-24 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Operasyon yok.
                  </TableCell>
                </TableRow>
              )}
              {ordered.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">{op.description}</TableCell>
                  <TableCell>{op.hours ?? "-"}</TableCell>
                  <TableCell>{op.cost != null ? `${op.cost} ₺` : "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {op.createdAt ? format(new Date(op.createdAt), "dd.MM.yyyy", { locale: tr }) : "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setOpenOp(op)} disabled={saving}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(op.id)} disabled={saving}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end text-sm text-muted-foreground">
          Toplam Maliyet: <span className="ml-2 font-medium text-foreground">{totalCost} ₺</span>
        </div>
      </CardContent>
    </Card>
  );
}

function OperationForm({
  op,
  caseId,
  token,
  onSaved,
  onClose,
}: {
  op: CaseOperation;
  caseId: string;
  token: string;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(op.description || "");
  const [hours, setHours] = useState(op.hours?.toString() || "");
  const [cost, setCost] = useState(op.cost?.toString() || "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    if (op.id) {
      await updateCaseOperation(
        op.id,
        { description, hours: hours ? Number(hours) : null, cost: cost ? Number(cost) : null },
        token,
      );
    } else {
      await createCaseOperation(
        caseId,
        { description, hours: hours ? Number(hours) : null, cost: cost ? Number(cost) : null },
        token,
      );
    }
    await onSaved();
    setLoading(false);
    onClose();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Açıklama</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Süre (saat)</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Maliyet (₺)</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button onClick={submit} disabled={loading || !description.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kaydet
        </Button>
      </div>
    </div>
  );
}
