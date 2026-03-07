"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Image from "next/image";

type FileData = {
  plate: string;
  customer: string;
  brandModel: string;
  fileNumber: string;
  accidentDate: string | null;
  completedAt: string | null;
  status: string;
  quickNote?: string | null;
};

type PartData = { id: number; name: string; quantity: number; status: string; unitPrice?: number | null; totalPrice?: number | null };
type OperationData = { id: number; title: string; status: string; note?: string | null; laborCost?: number | null; materialCost?: number | null };
type PricingSummary = {
  fileId: number;
  parts: { items: { id: number; name: string; quantity: number; unitPrice: number; totalPrice: number; status: string }[]; total: number };
  operations: { items: { id: number; title: string; laborCost: number; materialCost: number; total: number; status: string }[]; laborTotal: number; materialTotal: number; total: number };
  summary: { subtotal: number; discount: number; taxRate: number; afterDiscount: number; taxAmount: number; grandTotal: number };
};
type PhotoData = { id: number; title?: string | null; url: string; note?: string | null };

const statusStyles: Record<string, string> = {
  open: "bg-sky-400 text-slate-950",
  pending: "bg-amber-300 text-slate-950",
  completed: "bg-lime-400 text-slate-950",
};

const statusLabels: Record<string, string> = {
  open: "Açık",
  pending: "Beklemede",
  completed: "Tamamlandı",
};

function formatDate(date: string | null) {
  if (!date) return "Devam ediyor";
  return new Date(date).toLocaleDateString("tr-TR");
}

const tabs = [
  { key: "summary", label: "Özet" },
  { key: "parts", label: "Parçalar" },
  { key: "operations", label: "İşlemler" },
  { key: "photos", label: "Fotoğraflar" },
  { key: "pricing", label: "Maliyet" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function InlineCell({ value, onSave, type = "text", prefix, placeholder, className }: {
  value: string | number | null | undefined;
  onSave: (val: string) => void;
  type?: "text" | "number";
  prefix?: string;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(value ?? "")); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== String(value ?? "")) onSave(draft);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(String(value ?? "")); setEditing(false); } }}
        className={`w-full rounded border border-lime-300/50 bg-white/10 px-2 py-1 text-sm text-white outline-none ${className ?? ""}`}
      />
    );
  }

  const display = value != null && value !== "" && value !== 0
    ? `${prefix ?? ""}${typeof value === "number" ? value.toLocaleString("tr-TR") : value}`
    : placeholder ?? "—";
  const dimmed = value == null || value === "" || value === 0;

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer rounded px-2 py-1 transition hover:bg-white/10 ${dimmed ? "text-slate-500" : ""} ${className ?? ""}`}
    >
      {display}
    </span>
  );
}

export function FileTabs({
  fileId,
  file,
  initialParts,
  operations,
  photos: initialPhotos,
}: {
  fileId: number;
  file: FileData;
  initialParts: PartData[];
  operations: OperationData[];
  photos: PhotoData[];
}) {
  const [active, setActive] = useState<TabKey>("summary");
  const [parts, setParts] = useState<PartData[]>(initialParts);
  const [partForm, setPartForm] = useState({ lines: "", status: "Beklemede", unitPrice: "" });
  const [partError, setPartError] = useState<string | null>(null);
  const [loadingPart, setLoadingPart] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkQuantity, setBulkQuantity] = useState<string>("");
  const [ops, setOps] = useState<OperationData[]>(operations);
  const [opForm, setOpForm] = useState({ lines: "", status: "Beklemede", laborCost: "", materialCost: "" });
  const [opError, setOpError] = useState<string | null>(null);
  const [opLoading, setOpLoading] = useState(false);
  const [opEditingId, setOpEditingId] = useState<number | null>(null);
  const [opStatusOptions, setOpStatusOptions] = useState<string[]>([]);
  const [showOpModal, setShowOpModal] = useState(false);
  const [selectedOpIds, setSelectedOpIds] = useState<number[]>([]);
  const [bulkOpStatus, setBulkOpStatus] = useState<string>("");
  const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoForm, setPhotoForm] = useState<{ files: File[]; title: string; note: string }>({
    files: [],
    title: "",
    note: "",
  });

  useEffect(() => {
    async function loadParts() {
      try {
        const res = await fetch(`/api/vehicle-files/parts?fileId=${fileId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as PartData[];
        setParts(data);
      } catch {
        /* silent */
      }
    }
    loadParts();
  }, [fileId]);

  useEffect(() => {
    async function loadStatuses() {
      try {
        const res = await fetch("/api/part-statuses", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { label: string }[];
        const labels = data.map((d) => d.label);
        setStatusOptions(labels);
        if (labels.length > 0) {
          setPartForm((p) => ({ ...p, status: p.status || labels[0], unitPrice: p.unitPrice }));
        }
      } catch {
        /* silent */
      }
    }
    loadStatuses();
  }, []);

  useEffect(() => {
    async function loadOps() {
      try {
        const res = await fetch(`/api/vehicle-files/operations?fileId=${fileId}`, { cache: "no-store" });
        if (!res.ok) return;
        setOps((await res.json()) as any);
      } catch {
        /* silent */
      }
    }
    loadOps();
  }, [fileId]);

  useEffect(() => {
    async function loadOpStatuses() {
      try {
        const res = await fetch("/api/operation-statuses", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { label: string }[];
        const labels = data.map((d) => d.label);
        setOpStatusOptions(labels);
        if (labels.length > 0) {
          setOpForm((p) => ({ ...p, status: p.status || labels[0], laborCost: p.laborCost, materialCost: p.materialCost }));
        }
      } catch {
        /* silent */
      }
    }
    loadOpStatuses();
  }, []);

  useEffect(() => {
    async function loadPhotos() {
      try {
        const res = await fetch(`/api/vehicle-files/photos?fileId=${fileId}`, { cache: "no-store" });
        if (!res.ok) return;
        setPhotos(await res.json());
      } catch {
        /* silent */
      }
    }
    loadPhotos();
  }, [fileId]);

  async function savePhoto(e: FormEvent) {
    e.preventDefault();
    setPhotoError(null);
    if (!photoForm.files || photoForm.files.length === 0) {
      setPhotoError("En az bir fotoğraf seçin.");
      return;
    }
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      photoForm.files.forEach((f) => formData.append("files", f));
      if (photoForm.title.trim()) formData.append("title", photoForm.title.trim());
      if (photoForm.note.trim()) formData.append("note", photoForm.note.trim());

      const res = await fetch(`/api/vehicle-files/photos?fileId=${fileId}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Eklenemedi");
      const refreshed = await fetch(`/api/vehicle-files/photos?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setPhotos(refreshed);
      setShowPhotoModal(false);
      setPhotoForm({ files: [], title: "", note: "" });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setPhotoLoading(false);
    }
  }

  async function deletePhoto(id: number) {
    if (!confirm("Bu fotoğraf silinsin mi?")) return;
    try {
      await fetch(`/api/photos/${id}`, { method: "DELETE" });
      setPhotos((p) => p.filter((x: any) => x.id !== id));
    } catch {
      /* silent */
    }
  }

  function parseLines() {
    return partForm.lines
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.*?)(?:\*(\d+))?$/);
        if (!match) return null;
        const name = match[1].trim();
        const qty = match[2] ? Number(match[2]) : 1;
        if (!name) return null;
        return { name, quantity: qty > 0 ? qty : 1 };
      })
      .filter(Boolean) as { name: string; quantity: number }[];
  }

  async function savePart(e: FormEvent) {
    e.preventDefault();
    setPartError(null);
    const parsed = parseLines();
    if (editingId) {
      if (parsed.length === 0) {
        setPartError("Düzenlemek için en az bir parça yazın.");
        return;
      }
      setLoadingPart(true);
      try {
        const first = parsed[0];
        const res = await fetch(`/api/parts/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: first.name,
            quantity: first.quantity,
            status: partForm.status,
            unitPrice: partForm.unitPrice ? Number(partForm.unitPrice) : null,
          }),
        });
        if (!res.ok) throw new Error("Güncellenemedi");
        const refreshed = await fetch(`/api/vehicle-files/parts?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
        setParts(refreshed);
      setPartForm({ lines: "", status: "Beklemede", unitPrice: "" });
      setEditingId(null);
      setShowPartModal(false);
    } catch (err) {
      setPartError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoadingPart(false);
    }
      return;
    }

    if (parsed.length === 0) {
      setPartError("En az bir parça ekleyin.");
      return;
    }
    setLoadingPart(true);
    try {
      for (const item of parsed) {
        const res = await fetch(`/api/vehicle-files/parts?fileId=${fileId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            quantity: item.quantity,
            status: partForm.status,
            unitPrice: partForm.unitPrice ? Number(partForm.unitPrice) : null,
          }),
        });
        if (!res.ok) throw new Error("Eklenemedi");
      }
      const refreshed = await fetch(`/api/vehicle-files/parts?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setParts(refreshed);
      setPartForm({ lines: "", status: "Beklemede", unitPrice: "" });
    } catch (err) {
      setPartError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoadingPart(false);
    }
  }

  async function deletePart(id: number) {
    if (!confirm("Bu parçayı silmek istiyor musunuz?")) return;
    try {
      await fetch(`/api/parts/${id}`, { method: "DELETE" });
      setParts((p) => p.filter((x) => x.id !== id));
    } catch {
      /* silent */
    }
  }

  async function bulkDelete() {
    if (selectedPartIds.length === 0) {
      setPartError("Lütfen silinecek parçaları seçin.");
      return;
    }
    if (!confirm("Seçili parçalar silinsin mi?")) return;
    setPartError(null);
    setLoadingPart(true);
    try {
      for (const id of selectedPartIds) {
        await fetch(`/api/parts/${id}`, { method: "DELETE" });
      }
      const refreshed = await fetch(`/api/vehicle-files/parts?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setParts(refreshed);
      setSelectedPartIds([]);
    } catch (err) {
      setPartError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoadingPart(false);
    }
  }

  async function bulkUpdate() {
    setPartError(null);
    if (selectedPartIds.length === 0) {
      setPartError("Lütfen güncellenecek parçaları seçin.");
      return;
    }
    if (!bulkStatus && !bulkQuantity) {
      setPartError("Durum veya adet girin.");
      return;
    }
    setLoadingPart(true);
    try {
      for (const id of selectedPartIds) {
        await fetch(`/api/parts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: bulkStatus || undefined,
            quantity: bulkQuantity ? Number(bulkQuantity) : undefined,
          }),
        });
      }
      const refreshed = await fetch(`/api/vehicle-files/parts?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setParts(refreshed);
      setSelectedPartIds([]);
      setBulkStatus("");
      setBulkQuantity("");
    } catch (err) {
      setPartError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoadingPart(false);
    }
  }

  function startEdit(part: PartData) {
    setEditingId(part.id);
    setPartForm({ lines: `${part.name}${part.quantity > 1 ? `*${part.quantity}` : ""}`, status: part.status, unitPrice: part.unitPrice != null ? String(part.unitPrice) : "" });
    setShowPartModal(true);
  }

  function togglePart(id: number) {
    setSelectedPartIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function parseOps() {
    return opForm.lines
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => ({ title: line }));
  }

  async function saveOp(e: FormEvent) {
    e.preventDefault();
    setOpError(null);
    const parsed = parseOps();
    if (opEditingId) {
      if (parsed.length === 0) {
        setOpError("Düzenlemek için bir işlem yazın.");
        return;
      }
      setOpLoading(true);
      try {
        const first = parsed[0];
        const res = await fetch(`/api/operations/${opEditingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: first.title,
            status: opForm.status,
            laborCost: opForm.laborCost ? Number(opForm.laborCost) : null,
            materialCost: opForm.materialCost ? Number(opForm.materialCost) : null,
          }),
        });
        if (!res.ok) throw new Error("Güncellenemedi");
        const refreshed = await fetch(`/api/vehicle-files/operations?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
        setOps(refreshed);
        setOpForm({ lines: "", status: "Beklemede", laborCost: "", materialCost: "" });
        setOpEditingId(null);
        setShowOpModal(false);
      } catch (err) {
        setOpError(err instanceof Error ? err.message : "Bilinmeyen hata");
      } finally {
        setOpLoading(false);
      }
      return;
    }

    if (parsed.length === 0) {
      setOpError("En az bir işlem ekleyin.");
      return;
    }
    setOpLoading(true);
    try {
      for (const item of parsed) {
        const res = await fetch(`/api/vehicle-files/operations?fileId=${fileId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            status: opForm.status,
            laborCost: opForm.laborCost ? Number(opForm.laborCost) : null,
            materialCost: opForm.materialCost ? Number(opForm.materialCost) : null,
          }),
        });
        if (!res.ok) throw new Error("Eklenemedi");
      }
      const refreshed = await fetch(`/api/vehicle-files/operations?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setOps(refreshed);
      setOpForm({ lines: "", status: "Beklemede", laborCost: "", materialCost: "" });
      setShowOpModal(false);
    } catch (err) {
      setOpError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setOpLoading(false);
    }
  }

  async function deleteOp(id: number) {
    if (!confirm("Bu işlemi silmek istiyor musunuz?")) return;
    try {
      await fetch(`/api/operations/${id}`, { method: "DELETE" });
      setOps((o) => o.filter((x: any) => x.id !== id));
    } catch {
      /* silent */
    }
  }

  async function bulkDeleteOps() {
    if (selectedOpIds.length === 0) {
      setOpError("Lütfen silinecek işlemleri seçin.");
      return;
    }
    if (!confirm("Seçili işlemler silinsin mi?")) return;
    setOpError(null);
    setOpLoading(true);
    try {
      for (const id of selectedOpIds) {
        await fetch(`/api/operations/${id}`, { method: "DELETE" });
      }
      const refreshed = await fetch(`/api/vehicle-files/operations?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setOps(refreshed);
      setSelectedOpIds([]);
    } catch (err) {
      setOpError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setOpLoading(false);
    }
  }

  async function bulkUpdateOps() {
    setOpError(null);
    if (selectedOpIds.length === 0) {
      setOpError("Lütfen güncellenecek işlemleri seçin.");
      return;
    }
    if (!bulkOpStatus) {
      setOpError("Durum seçin.");
      return;
    }
    setOpLoading(true);
    try {
      for (const id of selectedOpIds) {
        await fetch(`/api/operations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkOpStatus }),
        });
      }
      const refreshed = await fetch(`/api/vehicle-files/operations?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setOps(refreshed);
      setSelectedOpIds([]);
      setBulkOpStatus("");
    } catch (err) {
      setOpError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setOpLoading(false);
    }
  }

  function startEditOp(op: OperationData) {
    setOpEditingId(op.id);
    setOpForm({ lines: op.title, status: op.status, laborCost: op.laborCost != null ? String(op.laborCost) : "", materialCost: op.materialCost != null ? String(op.materialCost) : "" });
    setShowOpModal(true);
  }

  function toggleOp(id: number) {
    setSelectedOpIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function patchPart(id: number, data: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const refreshed = await fetch(`/api/vehicle-files/parts?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setParts(refreshed);
    } catch { /* silent */ }
  }

  async function patchOp(id: number, data: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/operations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const refreshed = await fetch(`/api/vehicle-files/operations?fileId=${fileId}`, { cache: "no-store" }).then((r) => r.json());
      setOps(refreshed);
    } catch { /* silent */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              active === tab.key
                ? "bg-lime-400 text-slate-950 shadow-[0_10px_30px_rgba(190,242,100,0.3)]"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "summary" && (
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Özet</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <p>
                <span className="text-slate-400">Araç sahibi:</span> {file.customer}
              </p>
              <p>
                <span className="text-slate-400">Araç marka/model:</span> {file.brandModel}
              </p>
              <p>
                <span className="text-slate-400">Kaza tarihi:</span> {formatDate(file.accidentDate)}
              </p>
              <p>
                <span className="text-slate-400">Tamamlanma tarihi:</span>{" "}
                {file.completedAt ? formatDate(file.completedAt) : "Devam ediyor"}
              </p>
              <p className="text-slate-200">
                <span className="text-slate-400">Not:</span> {file.quickNote ?? "—"}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[file.status]}`}>
                {statusLabels[file.status] ?? file.status}
              </span>
              <span className="text-slate-300">Durum</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Özet kartı</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <p>
                <span className="text-slate-400">Dosya no:</span> {file.fileNumber}
              </p>
              <p>
                <span className="text-slate-400">Plaka:</span> {file.plate}
              </p>
            </div>
          </div>
        </div>
      )}

      {active === "parts" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Parçalar</p>
              <h3 className="text-lg font-semibold text-white">Parça listesi</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setPartForm({ lines: "", status: "Beklemede", unitPrice: "" });
                setPartError(null);
                setShowPartModal(true);
              }}
              className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
            >
              Parça ekle
            </button>
          </div>
          <div className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200 sm:grid-cols-4">
            <div className="sm:col-span-2 flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:border-lime-300/70 focus:outline-none"
              >
                <option value="">Durum seç (opsiyonel)</option>
                {(statusOptions.length ? statusOptions : ["Beklemede"]).map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0f0f14] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="number"
                min={1}
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                placeholder="Adet (ops.)"
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={bulkDelete}
                className="rounded-md border border-red-500/50 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
              >
                Seçileni sil
              </button>
              <button
                type="button"
                onClick={bulkUpdate}
                disabled={loadingPart}
                className="rounded-md border border-lime-500 bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
              >
                {loadingPart ? "İşleniyor..." : "Toplu güncelle"}
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={selectedPartIds.length > 0 && selectedPartIds.length === parts.length} onChange={(e) => setSelectedPartIds(e.target.checked ? parts.map((p) => p.id) : [])} className="h-4 w-4 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60" />
                    </th>
                    <th className="px-4 py-3">Parça</th>
                    <th className="px-4 py-3 w-20">Adet</th>
                    <th className="px-4 py-3 text-right w-32">Birim Fiyat</th>
                    <th className="px-4 py-3 text-right w-32">Toplam</th>
                    <th className="px-4 py-3 w-28">Durum</th>
                    <th className="px-4 py-3 text-right w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {parts.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Parça kaydı yok.</td></tr>
                  ) : parts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 group">
                      <td className="px-4 py-2">
                        <input type="checkbox" checked={selectedPartIds.includes(p.id)} onChange={() => togglePart(p.id)} className="h-4 w-4 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60" />
                      </td>
                      <td className="px-4 py-2 text-white font-medium">{p.name}</td>
                      <td className="px-2 py-2">
                        <InlineCell value={p.quantity} type="number" onSave={(v) => patchPart(p.id, { quantity: Number(v) || 1 })} className="w-16 text-center" />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <InlineCell value={p.unitPrice} type="number" prefix="₺" placeholder="Fiyat gir" onSave={(v) => patchPart(p.id, { unitPrice: v ? Number(v) : null })} className="w-24 text-right" />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-white">
                        {p.totalPrice != null ? `₺${p.totalPrice.toLocaleString("tr-TR")}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-200 text-xs">{p.status}</td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => deletePart(p.id)} className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/10">Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {parts.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">Parça kaydı yok.</div>
            ) : parts.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedPartIds.includes(p.id)} onChange={() => togglePart(p.id)} className="h-4 w-4 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60" />
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">{p.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="block text-slate-400 mb-1">Adet</span>
                    <InlineCell value={p.quantity} type="number" onSave={(v) => patchPart(p.id, { quantity: Number(v) || 1 })} className="text-center" />
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Birim Fiyat</span>
                    <InlineCell value={p.unitPrice} type="number" prefix="₺" placeholder="—" onSave={(v) => patchPart(p.id, { unitPrice: v ? Number(v) : null })} />
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Toplam</span>
                    <span className="px-2 py-1 text-sm font-medium text-white">{p.totalPrice != null ? `₺${p.totalPrice.toLocaleString("tr-TR")}` : "—"}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => deletePart(p.id)} className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPartModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-lg space-y-3 rounded-2xl border border-white/10 bg-[#0f0f14] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingId ? "Parça düzenle" : "Parça ekle"}</h3>
              <button
                onClick={() => {
                  setShowPartModal(false);
                  setEditingId(null);
                  setPartForm({ lines: "", status: "Beklemede", unitPrice: "" });
                  setPartError(null);
                }}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form onSubmit={savePart} className="space-y-2">
            <textarea
              placeholder="Parça adlarını alt alta yazın. Örn: Kaput*2"
              value={partForm.lines}
              onChange={(e) => setPartForm((p) => ({ ...p, lines: e.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              rows={4}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Birim fiyat (₺)"
              value={partForm.unitPrice}
              onChange={(e) => setPartForm((p) => ({ ...p, unitPrice: e.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
            />
            <select
              value={partForm.status}
              onChange={(e) => setPartForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white bg-[#0f0f14] focus:border-lime-300/70 focus:outline-none"
            >
              {statusOptions.length === 0 ? <option>Beklemede</option> : null}
              {statusOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0f0f14] text-white">
                  {opt}
                </option>
              ))}
            </select>
            {partError ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{partError}</div>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPartModal(false);
                  setEditingId(null);
                  setPartForm({ lines: "", status: "Beklemede", unitPrice: "" });
                    setPartError(null);
                  }}
                  className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loadingPart}
                  className="rounded-md border border-lime-500 bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {loadingPart ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {active === "operations" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">İşlemler</p>
              <h3 className="text-lg font-semibold text-white">İşlem listesi</h3>
            </div>
            <button
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
              onClick={() => {
                setOpEditingId(null);
                setOpForm({ lines: "", status: opStatusOptions[0] || "Beklemede", laborCost: "", materialCost: "" });
                setOpError(null);
                setShowOpModal(true);
              }}
            >
              İşlem ekle
            </button>
          </div>

          <div className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <select
                value={bulkOpStatus}
                onChange={(e) => setBulkOpStatus(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:border-lime-300/70 focus:outline-none"
              >
                <option value="">Durum seç (opsiyonel)</option>
                {(opStatusOptions.length ? opStatusOptions : ["Beklemede"]).map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0f0f14] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={bulkDeleteOps}
                className="rounded-md border border-red-500/50 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
              >
                Seçileni sil
              </button>
              <button
                type="button"
                onClick={bulkUpdateOps}
                disabled={opLoading}
                className="rounded-md border border-lime-500 bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
              >
                {opLoading ? "İşleniyor..." : "Toplu güncelle"}
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={selectedOpIds.length > 0 && selectedOpIds.length === ops.length} onChange={(e) => setSelectedOpIds(e.target.checked ? ops.map((o: OperationData) => o.id) : [])} className="h-4 w-4 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60" />
                    </th>
                    <th className="px-4 py-3">İşlem</th>
                    <th className="px-4 py-3 text-right w-32">İşçilik</th>
                    <th className="px-4 py-3 text-right w-32">Malzeme</th>
                    <th className="px-4 py-3 w-28">Durum</th>
                    <th className="px-4 py-3 text-right w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {ops.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">İşlem kaydı yok.</td></tr>
                  ) : ops.map((op: OperationData) => (
                    <tr key={op.id} className="hover:bg-white/5 group">
                      <td className="px-4 py-2">
                        <input type="checkbox" checked={selectedOpIds.includes(op.id)} onChange={() => toggleOp(op.id)} className="h-4 w-4 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60" />
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-white font-medium">{op.title}</span>
                        {op.note && <span className="block text-xs text-slate-400 mt-0.5">{op.note}</span>}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <InlineCell value={op.laborCost} type="number" prefix="₺" placeholder="İşçilik" onSave={(v) => patchOp(op.id, { laborCost: v ? Number(v) : null })} className="w-24 text-right" />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <InlineCell value={op.materialCost} type="number" prefix="₺" placeholder="Malzeme" onSave={(v) => patchOp(op.id, { materialCost: v ? Number(v) : null })} className="w-24 text-right" />
                      </td>
                      <td className="px-4 py-2 text-slate-200 text-xs">{op.status}</td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => deleteOp(op.id)} className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/10">Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {ops.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">İşlem kaydı yok.</div>
            ) : ops.map((op: OperationData) => (
              <div key={op.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedOpIds.includes(op.id)} onChange={() => toggleOp(op.id)} className="h-4 w-4 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60" />
                    <div>
                      <span className="text-sm font-semibold text-white">{op.title}</span>
                      {op.note && <span className="block text-xs text-slate-400">{op.note}</span>}
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">{op.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-slate-400 mb-1">İşçilik</span>
                    <InlineCell value={op.laborCost} type="number" prefix="₺" placeholder="—" onSave={(v) => patchOp(op.id, { laborCost: v ? Number(v) : null })} />
                  </div>
                  <div>
                    <span className="block text-slate-400 mb-1">Malzeme</span>
                    <InlineCell value={op.materialCost} type="number" prefix="₺" placeholder="—" onSave={(v) => patchOp(op.id, { materialCost: v ? Number(v) : null })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => deleteOp(op.id)} className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === "photos" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fotoğraflar</p>
              <h3 className="text-lg font-semibold text-white">Araç fotoğrafları</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPhotoModal(true);
                setPhotoError(null);
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
            >
              Fotoğraf ekle
            </button>
          </div>
          {photos.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-300">
              Fotoğraf bulunmuyor.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo: any) => (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <div className="relative h-32 bg-black/20">
                    <Image src={photo.url} alt={photo.title || "Fotoğraf"} className="object-cover" fill unoptimized />
                  </div>
                  <div className="space-y-1 px-4 py-3 text-sm text-slate-200">
                    <p className="font-semibold text-white">{photo.title || "Başlık yok"}</p>
                    <p className="text-xs text-slate-300">{photo.note || "—"}</p>
                  </div>
                  <div className="flex items-center justify-between px-4 pb-3 text-xs text-slate-200">
                    <a href={photo.url} target="_blank" rel="noreferrer" className="underline hover:text-white">
                      Görüntüle
                    </a>
                    <button
                      type="button"
                      onClick={() => deletePhoto(photo.id)}
                      className="rounded-md border border-red-500/50 px-3 py-1 text-red-200 hover:bg-red-500/10"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {active === "pricing" && <PricingTab fileId={fileId} />}

      {showPhotoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-lg space-y-3 rounded-2xl border border-white/10 bg-[#0f0f14] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Fotoğraf ekle</h3>
              <button
              onClick={() => {
                setShowPhotoModal(false);
                setPhotoForm({ files: [], title: "", note: "" });
                setPhotoError(null);
              }}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form onSubmit={savePhoto} className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Fotoğraf dosyası</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={(e) => setPhotoForm((p) => ({ ...p, files: Array.from(e.target.files || []) }))}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-900 file:bg-lime-300 focus:border-lime-300/70 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Sadece görsel dosyaları yükleyin. Birden fazla dosya seçebilirsiniz.
                </p>
                {photoForm.files.length > 0 ? (
                  <p className="text-[11px] text-lime-300">
                    {photoForm.files.length} adet seçildi
                  </p>
                ) : null}
              </div>
              <input
                type="text"
                placeholder="Başlık (opsiyonel)"
                value={photoForm.title}
                onChange={(e) => setPhotoForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              />
              <textarea
                placeholder="Not (opsiyonel)"
                value={photoForm.note}
                onChange={(e) => setPhotoForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                rows={3}
              />
              {photoError ? (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{photoError}</div>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false);
                    setPhotoForm({ files: [], title: "", note: "" });
                    setPhotoError(null);
                  }}
                  className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={photoLoading}
                  className="rounded-md border border-lime-500 bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {photoLoading ? "Kaydediliyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showOpModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-lg space-y-3 rounded-2xl border border-white/10 bg-[#0f0f14] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{opEditingId ? "İşlem düzenle" : "İşlem ekle"}</h3>
              <button
                onClick={() => {
                  setShowOpModal(false);
                  setOpEditingId(null);
                  setOpForm({ lines: "", status: "Beklemede", laborCost: "", materialCost: "" });
                  setOpError(null);
                }}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form onSubmit={saveOp} className="space-y-2">
              <textarea
                placeholder="İşlemleri alt alta yazın."
                value={opForm.lines}
                onChange={(e) => setOpForm((p) => ({ ...p, lines: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="İşçilik maliyeti (₺)"
                  value={opForm.laborCost}
                  onChange={(e) => setOpForm((p) => ({ ...p, laborCost: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Malzeme maliyeti (₺)"
                  value={opForm.materialCost}
                  onChange={(e) => setOpForm((p) => ({ ...p, materialCost: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                />
              </div>
              <select
                value={opForm.status}
                onChange={(e) => setOpForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white bg-[#0f0f14] focus:border-lime-300/70 focus:outline-none"
              >
                {opStatusOptions.length === 0 ? <option>Beklemede</option> : null}
                {opStatusOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0f0f14] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              {opError ? (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{opError}</div>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOpModal(false);
                    setOpEditingId(null);
                    setOpForm({ lines: "", status: "Beklemede", laborCost: "", materialCost: "" });
                    setOpError(null);
                  }}
                  className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={opLoading}
                  className="rounded-md border border-lime-500 bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {opLoading ? "Kaydediliyor..." : opEditingId ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

function PricingTab({ fileId }: { fileId: number }) {
  const [data, setData] = useState<PricingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDiscount, setEditDiscount] = useState("");
  const [editTaxRate, setEditTaxRate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicle-files/${fileId}/pricing`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setEditDiscount(String(json.summary.discount));
        setEditTaxRate(String(json.summary.taxRate));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPricing(); }, [fileId]);

  const savePricing = async () => {
    setSaving(true);
    try {
      await fetch(`/api/vehicle-files/${fileId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discount: parseFloat(editDiscount) || 0,
          taxRate: parseFloat(editTaxRate) || 20,
        }),
      });
      await fetchPricing();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse rounded-xl bg-white/5 p-6 h-40" />;
  if (!data) return <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Maliyet bilgisi yüklenemedi.</div>;

  return (
    <div className="space-y-4">
      {/* Parça Maliyetleri */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Parça Maliyetleri</h3>
        {data.parts.items.length === 0 ? (
          <p className="text-xs text-slate-400">Parça yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-200">
              <thead><tr className="border-b border-white/10 text-left text-slate-400">
                <th className="pb-2">Parça</th><th className="pb-2">Adet</th><th className="pb-2 text-right">Birim Fiyat</th><th className="pb-2 text-right">Toplam</th>
              </tr></thead>
              <tbody>
                {data.parts.items.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(p.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(p.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="font-semibold text-white">
                <td colSpan={3} className="pt-2 text-right">Parça Toplamı:</td>
                <td className="pt-2 text-right">{formatCurrency(data.parts.total)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>

      {/* İşlem Maliyetleri */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">İşlem Maliyetleri</h3>
        {data.operations.items.length === 0 ? (
          <p className="text-xs text-slate-400">İşlem yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-200">
              <thead><tr className="border-b border-white/10 text-left text-slate-400">
                <th className="pb-2">İşlem</th><th className="pb-2 text-right">İşçilik</th><th className="pb-2 text-right">Malzeme</th><th className="pb-2 text-right">Toplam</th>
              </tr></thead>
              <tbody>
                {data.operations.items.map((op) => (
                  <tr key={op.id} className="border-b border-white/5">
                    <td className="py-2">{op.title}</td>
                    <td className="py-2 text-right">{formatCurrency(op.laborCost)}</td>
                    <td className="py-2 text-right">{formatCurrency(op.materialCost)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(op.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="font-semibold text-white">
                <td className="pt-2 text-right">Toplam:</td>
                <td className="pt-2 text-right">{formatCurrency(data.operations.laborTotal)}</td>
                <td className="pt-2 text-right">{formatCurrency(data.operations.materialTotal)}</td>
                <td className="pt-2 text-right">{formatCurrency(data.operations.total)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Genel Özet */}
      <div className="rounded-xl border border-lime-300/30 bg-white/5 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Genel Özet</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Alt Toplam</span><span className="text-white">{formatCurrency(data.summary.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="discount" className="text-slate-300">İndirim (TL)</label>
            <input id="discount" type="number" min="0" step="0.01" value={editDiscount} onChange={(e) => setEditDiscount(e.target.value)}
              className="w-28 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-right text-sm text-white" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="taxRate" className="text-slate-300">KDV (%)</label>
            <input id="taxRate" type="number" min="0" max="100" step="1" value={editTaxRate} onChange={(e) => setEditTaxRate(e.target.value)}
              className="w-28 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-right text-sm text-white" />
          </div>
          <div className="flex justify-between text-slate-300">
            <span>KDV Tutarı</span><span className="text-white">{formatCurrency(data.summary.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold">
            <span className="text-white">Genel Toplam</span><span className="text-lime-300">{formatCurrency(data.summary.grandTotal)}</span>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <a href={`/api/vehicle-files/${fileId}/pdf?type=quote`} target="_blank" rel="noreferrer"
              className="rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/20">
              Teklif PDF
            </a>
            <a href={`/api/vehicle-files/${fileId}/pdf?type=invoice`} target="_blank" rel="noreferrer"
              className="rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/20">
              Fatura PDF
            </a>
            <a href={`/api/vehicle-files/${fileId}/pdf?type=assessment`} target="_blank" rel="noreferrer"
              className="rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/20">
              Hasar Raporu PDF
            </a>
            <button type="button" onClick={savePricing} disabled={saving}
              className="rounded-md border border-lime-500 bg-lime-400 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
