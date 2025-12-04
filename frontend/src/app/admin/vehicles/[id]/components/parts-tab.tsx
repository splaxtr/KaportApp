"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PartRow, addCasePart, deletePart, updatePart } from "@/lib/api/parts";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

export function PartsTab({
  parts,
  token,
  caseId,
  shopId,
}: {
  parts: PartRow[];
  token: string;
  caseId?: string | null;
  shopId?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<PartRow[]>(parts || []);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", statusKey: "pending", quantity: 1, position: "" });
  const [bulkText, setBulkText] = useState("");

  const handleDelete = async (id: string) => {
    setBusy(id);
    try {
      await deletePart(id, token);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">Parçalar ({parts.length})</div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditingId(null);
              setForm({ name: "", statusKey: "pending", quantity: 1, position: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!caseId}>
              {caseId ? "Parça Ekle" : "Önce dosya seçin"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Parçayı Düzenle" : "Parça Ekle"}</DialogTitle>
            </DialogHeader>
            {editingId ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Ad</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Durum</Label>
                  <Select value={form.statusKey} onValueChange={(v) => setForm((p) => ({ ...p, statusKey: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Bekliyor</SelectItem>
                      <SelectItem value="ordered">Sipariş Verildi</SelectItem>
                      <SelectItem value="shipping">Yolda</SelectItem>
                      <SelectItem value="arrived">Geldi</SelectItem>
                      <SelectItem value="installed">Takıldı</SelectItem>
                      <SelectItem value="repair_pending">Tamir Edilecek</SelectItem>
                      <SelectItem value="repair_sent">Tamire Gönderildi</SelectItem>
                      <SelectItem value="repaired">Tamir Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Adet</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Konum / Not</Label>
                  <Input value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Parçalar (her satırda bir, çoklu için “*adet” yazın)</Label>
                <Textarea
                  placeholder={`Sağ çamurluk farı\nTekerlek *4`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={6}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button
                onClick={async () => {
                  if (!caseId) return;
                  setBusy("save");
                  try {
                    if (editingId) {
                      const updated = await updatePart(editingId, form, token);
                      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    } else {
                      const lines = bulkText
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean);
                      const payloads = lines.map((line) => {
                        const match = line.match(/^(.*?)(?:\s*\*\s*(\d+))?$/i);
                        const name = (match?.[1] || "").trim();
                        const qty = match?.[2] ? Number(match[2]) : 1;
                        return { name, quantity: qty, statusKey: "pending" };
                      });
                      for (const p of payloads) {
                        if (p.name) {
                          const created = await addCasePart(caseId, shopId || "", p, token);
                          setItems((prev) => [created, ...prev]);
                        }
                      }
                    }
                    setOpen(false);
                    setEditingId(null);
                    setForm({ name: "", statusKey: "pending", quantity: 1, position: "" });
                  } catch (err) {
                    console.error(err);
                    alert("Kaydedilemedi. Lütfen tekrar deneyin.");
                  } finally {
                    setBusy(null);
                  }
                }}
                disabled={
                  busy === "save" ||
                  (!editingId && bulkText.trim().length === 0) ||
                  (!!editingId && !form.name)
                }
              >
                {busy === "save" ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {!caseId && <div className="text-sm text-muted-foreground">Bir dosya seçilmedi.</div>}
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Adet</TableHead>
              <TableHead>Güncellendi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                <TableCell>
                  <PartStatusBadge status={p.statusKey} />
                </TableCell>
                <TableCell className="text-muted-foreground">{p.quantity ?? 1}</TableCell>
                <TableCell className="text-muted-foreground">
                  {p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : "-"}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(p.id);
                      setForm({
                        name: p.name,
                        statusKey: p.statusKey,
                        quantity: p.quantity ?? 1,
                        position: p.position || "",
                      });
                      setOpen(true);
                    }}
                  >
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={busy === p.id}
                    onClick={() => handleDelete(p.id)}
                  >
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground">
        Durumlar: Bekliyor, Sipariş Verildi, Yolda, Geldi, Takıldı, Tamir Edilecek, Tamire Gönderildi, Tamir Edildi.
      </div>
    </div>
  );
}

function PartStatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    pending: "Bekliyor",
    waiting: "Bekliyor",
    ordered: "Sipariş Verildi",
    shipping: "Yolda",
    arrived: "Geldi",
    installed: "Takıldı",
    repair_pending: "Tamir Edilecek",
    repair_sent: "Tamire Gönderildi",
    repaired: "Tamir Edildi",
  };
  return <Badge variant="outline">{status ? map[status] || status : "Bilinmiyor"}</Badge>;
}
