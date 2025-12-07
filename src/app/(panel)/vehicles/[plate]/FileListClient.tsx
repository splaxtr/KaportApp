"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizePlate } from "@/lib/plate";

type FileRow = {
  id: number;
  plate: string;
  brandModel: string;
  customer: { id: number; fullName: string };
  status: string;
  quickNote: string | null;
  updatedAt: string;
  fileNumber?: string | null;
  accidentDate?: string | null;
};

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

function formatDate(date?: string | null) {
  if (!date) return "Devam ediyor";
  return new Date(date).toLocaleDateString("tr-TR");
}

export default function FileListClient({ files }: { files: FileRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [targetFileId, setTargetFileId] = useState<number | null>(null);
  const [expiryMode, setExpiryMode] = useState<"24h" | "7d" | "30d" | "custom">("7d");
  const [customDate, setCustomDate] = useState("");
  const [createdLink, setCreatedLink] = useState<{ url: string; token: string; keys?: string[] } | null>(null);

  async function onDelete(id: number) {
    if (!confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;
    setDeletingId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/vehicle-files/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Silme işlemi başarısız");
      }
      setInfo("Dosya silindi.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setDeletingId(null);
    }
  }

  async function onCreateReviewLink(fileId: number) {
    setError(null);
    setInfo(null);
    setCreatedLink(null);
    setTargetFileId(fileId);
    setShowModal(true);
  }

  if (files.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
        Bu plakaya ait dosya bulunamadı. Yeni dosya açabilirsiniz.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>
      ) : null}
      {info ? (
        <div className="rounded-md border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs text-lime-100">{info}</div>
      ) : null}
      {/* Masaüstü tablo */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3">Araç marka/model</th>
              <th className="px-4 py-3">Dosya no</th>
              <th className="px-4 py-3">Araç sahibi</th>
              <th className="px-4 py-3">Kaza tarihi</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white">{file.brandModel}</td>
                <td className="px-4 py-3 text-slate-200">{file.fileNumber ?? "—"}</td>
                <td className="px-4 py-3 text-slate-200">{file.customer.fullName}</td>
                <td className="px-4 py-3 text-slate-200">{formatDate(file.accidentDate)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[file.status] || "bg-white/10"}`}>
                    {statusLabels[file.status] ?? file.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs text-slate-200">
                    <Link
                      href={`/vehicles/${encodeURIComponent(normalizePlate(file.plate))}/${file.id}`}
                      className="rounded-lg border border-white/10 px-3 py-1 transition hover:border-lime-300/70 hover:text-white"
                    >
                      Detaylar
                    </Link>
                    <button
                      type="button"
                      onClick={() => onCreateReviewLink(file.id)}
                      disabled={creatingId === file.id}
                      className="rounded-lg border border-white/10 px-3 py-1 transition hover:border-lime-300/70 hover:text-white"
                    >
                      {creatingId === file.id ? "Oluşturuluyor..." : "İnceleme linki"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(file.id)}
                      disabled={deletingId === file.id}
                      className="rounded-lg border border-red-500/50 px-3 py-1 text-red-200 transition hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {deletingId === file.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobil kart görünümü */}
      <div className="space-y-3 md:hidden">
        {files.map((file) => (
          <div key={file.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araç dosyası</p>
                <p className="text-lg font-semibold text-white">{file.brandModel}</p>
                <p className="text-sm text-slate-300">Sahip: {file.customer.fullName}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[file.status] || "bg-white/10"}`}>
                {statusLabels[file.status] ?? file.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-200">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Dosya no</p>
                <p>{file.fileNumber ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Kaza tarihi</p>
                <p>{formatDate(file.accidentDate)}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
              <Link
                href={`/vehicles/${encodeURIComponent(normalizePlate(file.plate))}/${file.id}`}
                className="rounded-lg border border-white/10 px-3 py-1 transition hover:border-lime-300/70 hover:text-white"
              >
                Detaylar
              </Link>
              <button
                type="button"
                onClick={() => onCreateReviewLink(file.id)}
                disabled={creatingId === file.id}
                className="rounded-lg border border-white/10 px-3 py-1 transition hover:border-lime-300/70 hover:text-white disabled:opacity-60"
              >
                {creatingId === file.id ? "Oluşturuluyor..." : "İnceleme linki"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(file.id)}
                disabled={deletingId === file.id}
                className="rounded-lg border border-red-500/50 px-3 py-1 text-red-200 transition hover:bg-red-500/10 disabled:opacity-60"
              >
                {deletingId === file.id ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && targetFileId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#0f0f14] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">İnceleme linki</p>
                <h3 className="text-xl font-semibold text-white">Geçerlilik süresi belirle</h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTargetFileId(null);
                  setCreatedLink(null);
                }}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">
                <input
                  type="radio"
                  checked={expiryMode === "24h"}
                  onChange={() => setExpiryMode("24h")}
                />
                24 saat
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">
                <input
                  type="radio"
                  checked={expiryMode === "7d"}
                  onChange={() => setExpiryMode("7d")}
                />
                7 gün
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">
                <input
                  type="radio"
                  checked={expiryMode === "30d"}
                  onChange={() => setExpiryMode("30d")}
                />
                30 gün
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">
                <input
                  type="radio"
                  checked={expiryMode === "custom"}
                  onChange={() => setExpiryMode("custom")}
                />
                Özel tarih/saat
              </label>
            </div>

            {expiryMode === "custom" ? (
              <div className="space-y-2">
                <label className="text-xs text-slate-300">Bitiş tarihi</label>
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white focus:border-lime-300/70 focus:outline-none"
                />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>
            ) : null}
            {info ? (
              <div className="rounded-md border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs text-lime-100">{info}</div>
            ) : null}
            {createdLink ? (
              <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <p>Link: <span className="underline">{createdLink.url}</span></p>
                {createdLink.keys && (
                  <p className="mt-1">Anahtarlar: {createdLink.keys.join(", ")}</p>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!targetFileId) return;
                  setCreatingId(targetFileId);
                  setError(null);
                  setInfo(null);
                  setCreatedLink(null);
                  try {
                    let expiresAt: string | null = null;
                    const now = new Date();
                    if (expiryMode === "24h") {
                      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
                    } else if (expiryMode === "7d") {
                      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                    } else if (expiryMode === "30d") {
                      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
                    } else if (expiryMode === "custom" && customDate) {
                      const d = new Date(customDate);
                      if (!Number.isNaN(d.getTime())) expiresAt = d.toISOString();
                    }

                    const res = await fetch("/api/review-links", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ fileId: targetFileId, expiresAt }),
                    });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      throw new Error(body?.error || "Link oluşturulamadı");
                    }
                    const created = await res.json();
                    const tokenValue = created.token || created?.token?.token || created?.token;
                    const link = `${window.location.origin}/review/${tokenValue}`;
                    await navigator.clipboard.writeText(link);
                    const keysText = created.keys ? ` Anahtarlar: ${created.keys.join(", ")}` : "";
                    setInfo(`İnceleme linki oluşturuldu ve panoya kopyalandı.${keysText}`);
                    setCreatedLink({ url: link, token: tokenValue, keys: created.keys });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Bilinmeyen hata");
                  } finally {
                    setCreatingId(null);
                  }
                }}
                disabled={creatingId === targetFileId}
                className="rounded-lg border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
              >
                {creatingId === targetFileId ? "Oluşturuluyor..." : "Oluştur"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
