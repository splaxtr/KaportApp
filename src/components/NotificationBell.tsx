"use client";

import { useEffect, useState, useCallback } from "react";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) setNotifications(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30sn polling
    return () => clearInterval(interval);
  }, [fetchCount]);

  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Bildirimler${count > 0 ? ` (${count} okunmamış)` : ""}`}
        className="relative rounded-lg border border-white/15 bg-white/10 p-2 text-slate-200 transition hover:bg-white/20"
      >
        <span className="text-base">🔔</span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Bildirimler</h3>
            {count > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs text-lime-300 hover:underline">
                Tümünü okundu yap
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Yükleniyor...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Bildirim yok</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`border-b border-white/5 px-4 py-3 ${!n.readAt ? "bg-white/[0.03]" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{n.title}</p>
                      <p className="text-xs text-slate-400">{n.message}</p>
                    </div>
                    {!n.readAt && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-lime-400" />}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
