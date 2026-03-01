"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

type ReviewData = {
  vehicle: { plate: string; brandModel: string; color: string | null; accidentDate: string | null; fileNumber: string };
  customer: { fullName: string };
  expert: { fullName: string } | null;
  quickNote: string | null;
  parts: { id: number; name: string; quantity: number }[];
  operations: { id: number; title: string }[];
  photos: { id: number; url: string; title?: string | null; note?: string | null }[];
};

export default function ReviewClient({ token }: { token: string }) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewData | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/review-links/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, key }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Geçersiz anahtar");
      }
      setData(await res.json());
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-10 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <h1 className="text-2xl font-semibold">Sigorta inceleme</h1>
          <p className="text-sm text-slate-300">Bu sayfaya erişmek için tek kullanımlık anahtar girin.</p>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                placeholder="Güvenlik anahtarı"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                required
              />
            </div>
            {error ? <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
            >
              {loading ? "Doğrulanıyor..." : "Giriş yap"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sigorta inceleme</p>
        <h1 className="text-3xl font-semibold">
          {data.vehicle.plate} • Dosya No: {data.vehicle.fileNumber}
        </h1>
        <p className="text-sm text-slate-300">Bu sayfa salt-okunurdur.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araç</p>
          <div className="mt-2 space-y-2 text-sm text-slate-200">
            <p>Plaka: {data.vehicle.plate}</p>
            <p>Marka/Model: {data.vehicle.brandModel}</p>
            <p>Renk: {data.vehicle.color ?? "—"}</p>
            <p>Kaza Tarihi: {data.vehicle.accidentDate ? new Date(data.vehicle.accidentDate).toLocaleDateString("tr-TR") : "—"}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Müşteri / Eksper</p>
          <div className="mt-2 space-y-2 text-sm text-slate-200">
            <p>Müşteri: {data.customer.fullName}</p>
            <p>Eksper: {data.expert ? data.expert.fullName : "—"}</p>
            <p>Not: {data.quickNote ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Parçalar</p>
        {data.parts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-200">Parça yok.</p>
        ) : (
          <table className="mt-3 w-full text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-2">Parça adı</th>
                <th className="pb-2 text-right">Adet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.parts.map((p) => (
                <tr key={p.id}>
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right font-medium text-lime-300">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">İşlemler</p>
        {data.operations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-200">İşlem yok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5 text-sm text-slate-200">
            {data.operations.map((o) => (
              <li key={o.id} className="flex items-center gap-2 py-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" />
                {o.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fotoğraflar</p>
        {data.photos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-200">Fotoğraf yok.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {data.photos.map((ph) => (
              <a
                key={ph.id}
                href={ph.url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                <div className="relative h-48 bg-black/20">
                  <Image src={ph.url} alt={ph.title ?? "Fotoğraf"} className="object-cover" fill unoptimized />
                </div>
                <div className="px-3 py-2 text-sm text-slate-200">
                  <p className="font-semibold text-white">{ph.title ?? "Fotoğraf"}</p>
                  <p className="text-xs text-slate-400">{ph.note ?? "—"}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
