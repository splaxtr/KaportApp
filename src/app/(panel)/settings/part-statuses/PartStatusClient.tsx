"use client";

import { useEffect, useState, FormEvent } from "react";
import { MobileCard, MobileCardList, CardAction } from "@/components/MobileCard";

type Status = { id: number; label: string; color: string | null; sortOrder: number };

export default function PartStatusClient() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState({ label: "", color: "", sortOrder: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/part-statuses", { cache: "no-store" });
      if (!res.ok) throw new Error("Durumlar alınamadı");
      setStatuses(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!form.label.trim()) {
      setError("Etiket zorunlu.");
      return;
    }
    try {
      if (editingId) {
        const res = await fetch(`/api/part-statuses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            color: form.color.trim() || null,
            sortOrder: form.sortOrder,
          }),
        });
        if (!res.ok) throw new Error("Güncellenemedi");
      } else {
        const res = await fetch("/api/part-statuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            color: form.color.trim() || null,
            sortOrder: form.sortOrder,
          }),
        });
        if (!res.ok) throw new Error("Eklenemedi");
      }
      setForm({ label: "", color: "", sortOrder: 0 });
      setEditingId(null);
      setInfo("Kaydedildi.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Silinsin mi?")) return;
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/part-statuses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      setStatuses((s) => s.filter((i) => i.id !== id));
      setInfo("Silindi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  function startEdit(s: Status) {
    setEditingId(s.id);
    setForm({ label: s.label, color: s.color ?? "", sortOrder: s.sortOrder });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ayarlar</p>
        <h1 className="text-3xl font-semibold">Parça durumları</h1>
        <p className="text-sm text-slate-300">Yeni durum ekleyin, düzenleyin veya kaldırın.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}
      {info ? (
        <div className="rounded-lg border border-lime-500/40 bg-lime-500/10 px-4 py-3 text-sm text-lime-100">{info}</div>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
        <input
          type="text"
          placeholder="Durum etiketi"
          value={form.label}
          onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none sm:col-span-2"
        />
        <input
          type="text"
          placeholder="Renk (opsiyonel) örn: #00bcd4"
          value={form.color}
          onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
        />
        <input
          type="number"
          placeholder="Sıra"
          value={form.sortOrder}
          onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
        />
        <div className="flex justify-end gap-2 sm:col-span-4">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ label: "", color: "", sortOrder: 0 });
              setError(null);
              setInfo(null);
            }}
            className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
          >
            Temizle
          </button>
          <button
            type="submit"
            className="rounded-md border border-lime-500 bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]"
          >
            {editingId ? "Güncelle" : "Ekle"}
          </button>
        </div>
      </form>

      <div className="hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-[520px] divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3">Etiket</th>
              <th className="px-4 py-3">Renk</th>
              <th className="px-4 py-3">Sıra</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-300">
                  Yükleniyor...
                </td>
              </tr>
            ) : statuses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-300">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              statuses.map((s) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{s.label}</td>
                  <td className="px-4 py-3 text-slate-200">{s.color ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200">{s.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="rounded-md border border-white/15 px-3 py-1 text-slate-200 hover:border-lime-300/70 hover:text-white"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id)}
                        className="rounded-md border border-red-500/50 px-3 py-1 text-red-200 hover:bg-red-500/10"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile card view */}
      <MobileCardList
        loading={loading}
        empty={!loading && statuses.length === 0}
        emptyMessage="Kayıt bulunamadı."
        loadingMessage="Yükleniyor..."
      >
        {statuses.map((s) => (
          <MobileCard
            key={s.id}
            title={s.label}
            fields={[
              {
                label: "Renk",
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: s.color ?? undefined }}
                    />
                    {s.color ?? "—"}
                  </span>
                ),
              },
              { label: "Sıra", value: s.sortOrder },
            ]}
            actions={
              <>
                <CardAction onClick={() => startEdit(s)}>Düzenle</CardAction>
                <CardAction variant="danger" onClick={() => onDelete(s.id)}>Sil</CardAction>
              </>
            }
          />
        ))}
      </MobileCardList>
    </div>
  );
}
