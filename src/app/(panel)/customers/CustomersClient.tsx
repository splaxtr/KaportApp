"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, FormEvent } from "react";

type Customer = {
  id: number;
  fullName: string;
  email: string | null;
  phones?: { phone: string; label: string | null }[];
  createdAt: string;
};

type CreatePayload = {
  fullName: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  address?: string;
  tcVkn?: string;
  note?: string;
};

export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreatePayload>({
    fullName: "",
    email: "",
    phone: "",
    altPhone: "",
    address: "",
    tcVkn: "",
    note: "",
  });

  const filtered = useMemo(() => customers, [customers]);

  async function loadCustomers(query?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Müşteriler alınamadı");
      const data = (await res.json()) as Customer[];
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await loadCustomers(search);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    if (!form.phone?.trim()) {
      setError("Telefon zorunludur.");
      return;
    }
    setCreating(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email?.trim() || undefined,
          tcVkn: form.tcVkn?.trim() || undefined,
          note: form.note?.trim() || undefined,
          phones: [
            { phone: form.phone.trim(), label: "Telefon" },
            ...(form.altPhone?.trim() ? [{ phone: form.altPhone.trim(), label: "Yedek" }] : []),
          ],
          addresses: form.address?.trim()
            ? [
                {
                  label: "Adres",
                  address: form.address.trim(),
                },
              ]
            : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Müşteri oluşturulamadı");
      }
      setForm({ fullName: "", email: "", phone: "", altPhone: "", address: "", tcVkn: "", note: "" });
      setShowModal(false);
      setInfo("Müşteri kaydedildi.");
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) return;
    setDeletingId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Silme işlemi başarısız");
      }
      setInfo("Müşteri silindi.");
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Müşteriler</p>
          <h1 className="text-3xl font-semibold">Müşteri yönetimi</h1>
          <p className="text-sm text-slate-300">Kişiler, iletişim bilgileri ve geçmiş araç dosyaları.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="İsim / e-posta / telefon"
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
            onClick={() => setShowModal(true)}
            className="rounded-lg border border-lime-300/60 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] sm:ml-2"
          >
            Yeni müşteri
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-lg border border-lime-500/40 bg-lime-500/10 px-4 py-3 text-sm text-lime-100">
          {info}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3">Ad Soyad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Telefon</th>
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
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{c.fullName}</td>
                  <td className="px-4 py-3 text-slate-200">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {c.phones && c.phones.length > 0 ? c.phones[0].phone : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-200">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/customers/${c.id}`}
                        className="rounded-md border border-white/10 px-3 py-1 transition hover:border-lime-300/70 hover:text-white"
                      >
                        Detay
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="rounded-md border border-red-500/50 px-3 py-1 text-red-200 transition hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {deletingId === c.id ? "Siliniyor..." : "Sil"}
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

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#0b0f1f] to-[#0c121f] p-6 shadow-2xl ring-1 ring-white/10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Müşteri</p>
                <h3 className="text-2xl font-semibold text-white">Yeni müşteri ekle</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={onCreate}>
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
                placeholder="TC / VKN (opsiyonel)"
                value={form.tcVkn}
                onChange={(e) => setForm((p) => ({ ...p, tcVkn: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Telefon"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Yedek telefon (opsiyonel)"
                value={form.altPhone}
                onChange={(e) => setForm((p) => ({ ...p, altPhone: e.target.value }))}
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
                placeholder="Adres (opsiyonel)"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none sm:col-span-2"
              />
              <textarea
                placeholder="Notlar (opsiyonel)"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none sm:col-span-2"
                rows={3}
              />
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {creating ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
