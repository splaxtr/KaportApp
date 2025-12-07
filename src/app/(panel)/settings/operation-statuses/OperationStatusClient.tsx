"use client";

import { FormEvent, useEffect, useState } from "react";

type Status = { id: number; label: string };

export default function OperationStatusClient() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/operation-statuses", { cache: "no-store" });
      if (!res.ok) throw new Error("Durumlar alınamadı");
      setStatuses(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError("Etiket zorunlu");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = { label: label.trim() };
      const res = await fetch(editingId ? `/api/operation-statuses/${editingId}` : "/api/operation-statuses", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setLabel("");
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/operation-statuses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  function startEdit(status: Status) {
    setEditingId(status.id);
    setLabel(status.label);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ayarlar</p>
        <h1 className="text-3xl font-semibold text-white">İşlem Durumları</h1>
        <p className="text-sm text-slate-300">İşlem (operation) durumlarını ekle, düzenle, sil.</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg md:grid-cols-3">
        <form onSubmit={save} className="md:col-span-1 space-y-3">
          <input
            type="text"
            placeholder="Durum etiketi"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
          />
          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
            >
              {loading ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setLabel("");
                }}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
              >
                İptal
              </button>
            ) : null}
          </div>
        </form>

        <div className="md:col-span-2 overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-[520px] divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3">Etiket</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-slate-300">
                    Kayıt yok.
                  </td>
                </tr>
              ) : (
                statuses.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white">{s.label}</td>
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
                          onClick={() => remove(s.id)}
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
      </div>
    </div>
  );
}
