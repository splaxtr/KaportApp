"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VehicleTaskRow, createCaseTask, deleteTask, updateTask } from "@/lib/api/vehicles";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  in_progress: "Devam ediyor",
  done: "Tamamlandı",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-200",
  in_progress: "bg-blue-500/20 text-blue-200",
  done: "bg-emerald-500/20 text-emerald-200",
};

type Props = {
  caseId?: string | null;
  token: string;
  initialTasks: VehicleTaskRow[];
};

export function TasksTab({ caseId, token, initialTasks }: Props) {
  const [tasks, setTasks] = useState<VehicleTaskRow[]>(initialTasks || []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleTaskRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ title: string; status: string; notes: string }>({
    title: "",
    status: "pending",
    notes: "",
  });
  const [bulkText, setBulkText] = useState("");

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")).reverse(),
    [tasks]
  );

  const reset = () => {
    setForm({ title: "", status: "pending", notes: "" });
    setEditing(null);
  };

  const onSave = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      if (editing) {
        const updated = await updateTask(
          editing.id,
          { title: form.title, status: form.status, notes: form.notes },
          token
        );
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const lines = bulkText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0 && form.title.trim()) {
          lines.push(form.title.trim());
        }
        for (const line of lines) {
          const created = await createCaseTask(caseId, { title: line, status: form.status, notes: form.notes }, token);
          setTasks((prev) => [created, ...prev]);
        }
      }
      setOpen(false);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteTask(id, token);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">İşlemler</h3>
          <p className="text-sm text-muted-foreground">Kaporta / mekanik işlemleri takip edin.</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="secondary">İşlem Ekle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "İşlemi Düzenle" : "Yeni İşlem"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {editing ? (
                <div className="space-y-1">
                  <Label>Başlık</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Örn: Sağ çamurluk boya"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>İşlemler (her satır bir işlem)</Label>
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`Çamurluk boya\nKaput düzeltme`}
                    rows={5}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label>Durum</Label>
                <Select value={form.status} onValueChange={(val) => setForm((f) => ({ ...f, status: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="in_progress">Devam ediyor</SelectItem>
                    <SelectItem value="done">Tamamlandı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Notlar</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Detaylı açıklama"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button
                  onClick={onSave}
                  disabled={
                    loading ||
                    (!editing && bulkText.trim().length === 0 && form.title.trim().length === 0) ||
                    (editing && !form.title.trim())
                  }
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!caseId ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Aktif dosya bulunamadı.
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Henüz işlem yok. “İşlem Ekle” ile başlayın.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <Badge className={cn("capitalize", statusColors[task.status] || "")}>
                    {statusLabels[task.status] || task.status}
                  </Badge>
                </div>
                {task.notes ? <p className="text-sm text-muted-foreground whitespace-pre-line">{task.notes}</p> : null}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(task);
                    setForm({
                      title: task.title,
                      status: task.status,
                      notes: task.notes || "",
                    });
                    setOpen(true);
                  }}
                >
                  Düzenle
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(task.id)}>
                  Sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
