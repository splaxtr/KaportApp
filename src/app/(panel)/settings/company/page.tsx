"use client";

import { useEffect, useState } from "react";

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  taxOffice: string;
}

const emptyData: CompanyData = { name: "", address: "", phone: "", email: "", taxId: "", taxOffice: "" };

export default function CompanySettingsPage() {
  const [form, setForm] = useState<CompanyData>(emptyData);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then((d) => setForm(d))
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("Kaydedildi");
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg("Hata oluştu");
      }
    } catch {
      setMsg("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: keyof CompanyData; label: string; placeholder: string }[] = [
    { key: "name", label: "Firma Adı", placeholder: "Örn: Yılmaz Oto Kaporta" },
    { key: "address", label: "Adres", placeholder: "Firma adresi" },
    { key: "phone", label: "Telefon", placeholder: "0212 xxx xx xx" },
    { key: "email", label: "E-posta", placeholder: "info@firma.com" },
    { key: "taxId", label: "Vergi No", placeholder: "Vergi numarası" },
    { key: "taxOffice", label: "Vergi Dairesi", placeholder: "Vergi dairesi adı" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ayarlar</p>
        <h1 className="text-3xl font-semibold">Firma Bilgileri</h1>
        <p className="text-sm text-slate-300">
          Burada girilen bilgiler PDF belgelerinde (teklif, fatura, hasar raporu) kullanılır.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-slate-300">{f.label}</span>
              <input
                type="text"
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
            </label>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-lime-500 px-6 py-2 font-semibold text-black transition hover:bg-lime-400 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {msg && (
            <span className={msg === "Kaydedildi" ? "text-lime-400 text-sm" : "text-red-400 text-sm"}>
              {msg}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
