"use client";

import { useMemo, useState } from "react";
import { CasePart, createCasePart, deleteCasePart, updateCasePart } from "@/lib/api/admin/cases";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, Pencil, Plus, Trash } from "lucide-react";

const partStatusColors: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-100 border-slate-500/40",
  ordered: "bg-blue-500/20 text-blue-100 border-blue-500/40",
  shipping: "bg-amber-500/20 text-amber-100 border-amber-500/40",
  arrived: "bg-green-500/20 text-green-100 border-green-500/40",
  installed: "bg-purple-500/20 text-purple-100 border-purple-500/40",
};

type Props = {
  caseId: string;
  parts: CasePart[];
  token: string;
  onRefresh: () => Promise<void>;
};

export function PartsTab({ caseId, parts, token, onRefresh }: Props) {
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CasePart | null>(null);

  const orderedParts = useMemo(
    () => [...parts].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [parts],
  );

  async function handleDelete(id: string) {
    setSaving(true);
    await deleteCasePart(id, token);
    await onRefresh();
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle>Parçalar</CardTitle>
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing({ id: "", caseId, name: "", status: "pending" })}>
              <Plus className="mr-2 h-4 w-4" />
              Parça Ekle
            </Button>
          </DialogTrigger>
          {editing && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing.id ? "Parçayı Düzenle" : "Yeni Parça"}</DialogTitle>
              </DialogHeader>
              <PartForm
                part={editing}
                token={token}
                onClose={() => setEditing(null)}
                onSaved={onRefresh}
                caseId={caseId}
              />
            </DialogContent>
          )}
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="w-24 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedParts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Parça yok.
                  </TableCell>
                </TableRow>
              )}
              {orderedParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">{part.name}</TableCell>
                  <TableCell>
                    <Badge className={partStatusColors[part.status] || "bg-muted"}>
                      {part.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{part.price != null ? `${part.price} ₺` : "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {part.createdAt ? format(new Date(part.createdAt), "dd.MM.yyyy", { locale: tr }) : "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(part)}
                      disabled={saving}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(part.id)}
                      disabled={saving}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PartForm({
  part,
  caseId,
  token,
  onSaved,
  onClose,
}: {
  part: CasePart;
  caseId: string;
  token: string;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(part.name || "");
  const [status, setStatus] = useState(part.status || "pending");
  const [price, setPrice] = useState(part.price?.toString() || "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    if (part.id) {
      await updateCasePart(
        part.id,
        { name, status, price: price ? Number(price) : null },
        token,
      );
    } else {
      await createCasePart(
        caseId,
        { name, status, price: price ? Number(price) : null },
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
        <Label>Parça Adı</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Durum</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Durum seç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Bekliyor</SelectItem>
            <SelectItem value="ordered">Sipariş</SelectItem>
            <SelectItem value="shipping">Yolda</SelectItem>
            <SelectItem value="arrived">Geldi</SelectItem>
            <SelectItem value="installed">Takıldı</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Fiyat (₺)</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button onClick={submit} disabled={loading || !name.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kaydet
        </Button>
      </div>
    </div>
  );
}
