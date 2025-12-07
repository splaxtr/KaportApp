"use client";

import { useEffect, useMemo, useState } from "react";

type TrashItem = {
  id: number;
  type: "customer" | "expert" | "vehicle" | "vehicleFile" | "part" | "operation" | "photo";
  label: string;
  deletedAt: string;
};

const typeLabels: Record<TrashItem["type"], string> = {
  customer: "Müşteri",
  expert: "Eksper",
  vehicle: "Araç",
  vehicleFile: "Araç Dosyası",
  part: "Parça",
  operation: "İşlem",
  photo: "Fotoğraf",
};

export default function TrashClient() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, TrashItem[]> = {};
    for (const item of items) {
      const key = typeLabels[item.type] || item.type;
      map[key] = map[key] ? [...map[key], item] : [item];
    }
    return map;
  }, [items]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trash", { cache: "no-store" });
      if (!res.ok) throw new Error("Silinen kayıtlar alınamadı");
      const data = (await res.json()) as TrashItem[];
      setItems(
        data.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: number, type: TrashItem["type"], action: "restore" | "purge") {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "İşlem başarısız");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setWorking(false);
    }
  }

  async function clearAll() {
    if (!confirm("Tüm silinen kayıtlar kalıcı olarak silinsin mi?")) return;
    setWorking(true);
    setError(null);
    try {
      await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purgeAll" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Silinenler</p>
          <h1 className="text-3xl font-semibold">Geri dönüşüm</h1>
          <p className="text-sm text-slate-300">Soft-delete kayıtları görüntüle, geri yükle veya kalıcı sil.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearAll}
            disabled={working || items.length === 0}
            className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-50"
          >
            Hepsini temizle
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-slate-300">
          Yükleniyor...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-slate-300">
          Silinmiş kayıt yok.
        </div>
      ) : (
        Object.entries(grouped).map(([group, list]) => (
          <div key={group} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wide text-slate-300 bg-white/5">
              <span>{group}</span>
              <span className="text-slate-400">{list.length} kayıt</span>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-[640px] divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-4 py-3">Ad</th>
                  <th className="px-4 py-3">Silinme Tarihi</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {list.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{item.label}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {new Date(item.deletedAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => act(item.id, item.type, "restore")}
                          disabled={working}
                          className="rounded-md border border-white/15 px-3 py-1 text-slate-200 hover:border-lime-300/70 hover:text-white disabled:opacity-50"
                        >
                          Geri yükle
                        </button>
                        <button
                          type="button"
                          onClick={() => act(item.id, item.type, "purge")}
                          disabled={working}
                          className="rounded-md border border-red-500/50 px-3 py-1 text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Kalıcı sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
