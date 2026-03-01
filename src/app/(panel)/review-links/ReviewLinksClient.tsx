"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { MobileCard, MobileCardList, CardAction } from "@/components/MobileCard";

type ReviewLink = {
  id: number;
  token: string;
  plate: string;
  fileId: number;
  status: "active" | "revoked" | "expired";
  expiresAt: string | null;
  createdAt: string;
  keys?: string[];
};

export default function ReviewLinksClient() {
  const [links, setLinks] = useState<ReviewLink[]>([]);
  const [fileId, setFileId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review-links", { cache: "no-store" });
      if (!res.ok) throw new Error("Linkler alınamadı");
      setLinks(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createLink(e: FormEvent) {
    e.preventDefault();
    if (!fileId.trim()) {
      setError("Dosya id zorunlu");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/review-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: Number(fileId),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Link oluşturulamadı");
      }
      setFileId("");
      setExpiresAt("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: number) {
    if (!confirm("Bu link iptal edilsin mi?")) return;
    await action(id, "revoke");
  }

  async function restore(id: number) {
    await action(id, "restore");
  }

  async function remove(id: number) {
    if (!confirm("Kalıcı silinsin mi?")) return;
    await action(id, "delete");
  }

  async function action(id: number, action: "revoke" | "restore" | "delete") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/review-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("İşlem başarısız");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sigorta İnceleme</p>
          <h1 className="text-3xl font-semibold">Review linkleri</h1>
          <p className="text-sm text-slate-300">Paylaşılabilir salt-okunur linkler: oluştur, iptal et, süre tanımla.</p>
        </div>
      </div>

      <form onSubmit={createLink} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="text-xs text-slate-300">Dosya ID</label>
          <input
            type="number"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="Araç dosyası ID"
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-300">Bitiş tarihi (opsiyonel)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
          >
            {loading ? "İşleniyor..." : "Yeni link"}
          </button>
        </div>
        {error ? (
          <div className="md:col-span-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        ) : null}
      </form>

      {loading && links.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-slate-300">Yükleniyor...</div>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-slate-300">Link yok.</div>
      ) : (
        <>
        <div className="hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Plaka</th>
                <th className="px-4 py-3">Dosya ID</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Geçerlilik</th>
                <th className="px-4 py-3">Anahtarlar</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-slate-100">
                    <Link
                      href={`/review/${encodeURIComponent(link.token)}`}
                      target="_blank"
                      className="underline underline-offset-2 hover:text-lime-200"
                    >
                      {link.token}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{link.plate}</td>
                  <td className="px-4 py-3 text-slate-200">{link.fileId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        link.status === "active" ? "bg-lime-400 text-slate-950" : "bg-red-400 text-slate-950"
                      }`}
                    >
                      {link.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {link.expiresAt ? new Date(link.expiresAt).toLocaleString("tr-TR") : "Süre yok"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {link.keys && link.keys.length > 0 ? link.keys.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/review/${link.token}`)}
                        className="rounded-md border border-white/15 px-3 py-1 text-slate-200 hover:border-lime-300/70 hover:text-white"
                      >
                        Kopyala
                      </button>
                      {link.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => revoke(link.id)}
                          className="rounded-md border border-amber-400/60 px-3 py-1 text-amber-200 hover:bg-amber-400/10"
                        >
                          İptal
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => restore(link.id)}
                          className="rounded-md border border-lime-300/70 px-3 py-1 text-lime-200 hover:bg-lime-400/10"
                        >
                          Aktif et
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(link.id)}
                        className="rounded-md border border-red-500/50 px-3 py-1 text-red-200 hover:bg-red-500/10"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Mobile card view */}
        <MobileCardList empty={links.length === 0} emptyMessage="Link yok.">
          {links.map((link) => (
            <MobileCard
              key={link.id}
              title={link.plate}
              subtitle={`Token: ${link.token.length > 20 ? link.token.slice(0, 20) + "..." : link.token}`}
              badge={{
                text: link.status,
                className:
                  link.status === "active"
                    ? "bg-lime-400 text-slate-950"
                    : "bg-red-400 text-slate-950",
              }}
              fields={[
                { label: "Dosya ID", value: link.fileId },
                {
                  label: "Geçerlilik",
                  value: link.expiresAt
                    ? new Date(link.expiresAt).toLocaleString("tr-TR")
                    : "Süre yok",
                },
                {
                  label: "Anahtarlar",
                  value: link.keys && link.keys.length > 0 ? link.keys.join(", ") : "—",
                },
              ]}
              actions={
                <>
                  <CardAction
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/review/${link.token}`
                      )
                    }
                  >
                    Kopyala
                  </CardAction>
                  {link.status === "active" ? (
                    <CardAction variant="warning" onClick={() => revoke(link.id)}>
                      İptal
                    </CardAction>
                  ) : (
                    <CardAction variant="success" onClick={() => restore(link.id)}>
                      Aktif et
                    </CardAction>
                  )}
                  <CardAction variant="danger" onClick={() => remove(link.id)}>
                    Sil
                  </CardAction>
                </>
              }
            />
          ))}
        </MobileCardList>
        </>
      )}
    </div>
  );
}
