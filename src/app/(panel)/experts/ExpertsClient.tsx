"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MobileCard, MobileCardList, CardAction, CardField } from "@/components/MobileCard";

type Expert = {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  note: string | null;
  createdAt: string;
};

type CreatePayload = {
  fullName: string;
  phone?: string;
  email?: string;
  company?: string;
  note?: string;
};

export default function ExpertsClient() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreatePayload>({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    note: "",
  });

  const filtered = useMemo(() => experts, [experts]);

  async function loadExperts(query?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/experts${query ? `?q=${encodeURIComponent(query)}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Eksperler alınamadı");
      const data = (await res.json()) as Expert[];
      setExperts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ fullName: "", phone: "", email: "", company: "", note: "" });
    setShowModal(true);
  }

  useEffect(() => {
    loadExperts();
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await loadExperts(search);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        company: form.company?.trim() || undefined,
        note: form.note?.trim() || undefined,
      };
      const res = await fetch(editingId ? `/api/experts/${editingId}` : "/api/experts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || (editingId ? "Eksper güncellenemedi" : "Eksper oluşturulamadı"));
      }
      setForm({ fullName: "", phone: "", email: "", company: "", note: "" });
      setEditingId(null);
      setShowModal(false);
      await loadExperts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(expert: Expert) {
    setEditingId(expert.id);
    setForm({
      fullName: expert.fullName,
      phone: expert.phone ?? "",
      email: expert.email ?? "",
      company: expert.company ?? "",
      note: expert.note ?? "",
    });
    setShowModal(true);
  }

  async function removeExpert(id: number) {
    if (!confirm("Bu eksper silinsin mi?")) return;
    try {
      const res = await fetch(`/api/experts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      await loadExperts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Eksperler</p>
          <h1 className="text-3xl font-semibold">Eksper yönetimi</h1>
          <p className="text-sm text-slate-300">Eksper listesi, iletişim ve dosya atamaları.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="İsim / firma"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-lime-300/70 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]"
            >
              Ara
            </button>
          </form>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg border border-lime-300/60 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] sm:ml-2"
          >
            Yeni eksper
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-[680px] divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3">Ad Soyad</th>
              <th className="px-4 py-3">Firma</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Oluşturma</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-300">
                  Yükleniyor...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-300">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{e.fullName}</td>
                  <td className="px-4 py-3 text-slate-200">{e.company ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200">{e.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200">{e.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-200">
                  {new Date(e.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      className="rounded-md border border-white/15 px-3 py-1 text-slate-200 hover:border-lime-300/70 hover:text-white"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExpert(e.id)}
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

      <MobileCardList loading={loading} empty={!loading && filtered.length === 0} emptyMessage="Kayıt bulunamadı." loadingMessage="Yükleniyor...">
        {filtered.map((e) => (
          <MobileCard
            key={e.id}
            title={e.fullName}
            subtitle={e.company ?? undefined}
            fields={[
              { label: "Telefon", value: e.phone ?? "—" },
              { label: "E-posta", value: e.email ?? "—" },
              { label: "Kayıt", value: new Date(e.createdAt).toLocaleDateString("tr-TR") },
            ]}
            actions={
              <>
                <CardAction onClick={() => startEdit(e)}>Düzenle</CardAction>
                <CardAction variant="danger" onClick={() => removeExpert(e.id)}>Sil</CardAction>
              </>
            }
          />
        ))}
      </MobileCardList>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#0b0f1f] to-[#0c121f] p-6 shadow-2xl ring-1 ring-white/10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Eksper</p>
                <h3 className="text-2xl font-semibold text-white">
                  {editingId ? "Eksper düzenle" : "Yeni eksper ekle"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setForm({ fullName: "", phone: "", email: "", company: "", note: "" });
                }}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
              <input
                type="text"
                placeholder="Ad Soyad"
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Telefon (opsiyonel)"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
              />
              <input
                type="email"
                placeholder="E-posta (opsiyonel)"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none sm:col-span-2"
              />
              <input
                type="text"
                placeholder="Firma (opsiyonel)"
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none sm:col-span-2"
              />
              <textarea
                placeholder="Not (opsiyonel)"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none sm:col-span-2"
                rows={3}
              />
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setForm({ fullName: "", phone: "", email: "", company: "", note: "" });
                  }}
                  className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {creating ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
