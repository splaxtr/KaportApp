"use client";

import { useState } from "react";

type Props = {
  customer: {
    id: number;
    fullName: string;
    email: string | null;
    tcVkn?: string | null;
    phones: string[];
    address?: string;
  };
};

export default function CustomerEdit({ customer }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fullName, setFullName] = useState(customer.fullName);
  const [email, setEmail] = useState(customer.email ?? "");
  const [tcVkn, setTcVkn] = useState(customer.tcVkn ?? "");
  const [phone, setPhone] = useState(customer.phones[0] ?? "");
  const [altPhone, setAltPhone] = useState(customer.phones[1] ?? "");
  const [address, setAddress] = useState(customer.address ?? "");

  async function onSave() {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const phoneData = [];
      if (phone.trim()) phoneData.push({ phone: phone.trim(), label: "Telefon" });
      if (altPhone.trim()) phoneData.push({ phone: altPhone.trim(), label: "Yedek" });

      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim() || null,
          tcVkn: tcVkn.trim() || null,
          phones: phoneData,
          addresses: address.trim()
            ? [
                {
                  address: address.trim(),
                  label: "Adres",
                },
              ]
            : [],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Güncelleme başarısız");
      }
      setInfo("Müşteri güncellendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-lime-300/60 bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]"
      >
        Düzenle
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#0f1119] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Müşteri düzenle</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>

            {error ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>
            ) : null}
            {info ? (
              <div className="rounded-md border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs text-lime-100">{info}</div>
            ) : null}

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                  placeholder="Ad Soyad"
                />
                <input
                  type="text"
                  value={tcVkn}
                  onChange={(e) => setTcVkn(e.target.value)}
                  className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                  placeholder="TC / VKN (opsiyonel)"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                  placeholder="Telefon"
                />
                <input
                  type="text"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                  placeholder="Yedek telefon (opsiyonel)"
                />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                placeholder="E-posta (opsiyonel)"
              />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-[#7c818c] focus:border-lime-400/70 focus:outline-none"
                rows={2}
                placeholder="Adres (opsiyonel)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-md border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
