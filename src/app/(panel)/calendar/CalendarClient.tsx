"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id: number;
  date: string;
  endDate: string | null;
  type: string;
  status: string;
  title: string;
  notes: string | null;
  customer?: { id: number; fullName: string } | null;
  vehicleFile?: { id: number; brandModel: string; vehicle: { plate: string } } | null;
  assignedTo?: { id: number; fullName: string } | null;
};

const typeLabels: Record<string, string> = {
  intake: "Araç Kabul",
  delivery: "Teslim",
  inspection: "Kontrol",
  expert: "Eksper",
  other: "Diğer",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-sky-400/20 text-sky-300 ring-sky-400/30",
  confirmed: "bg-lime-400/20 text-lime-300 ring-lime-400/30",
  cancelled: "bg-red-400/20 text-red-300 ring-red-400/30",
  completed: "bg-slate-400/20 text-slate-300 ring-slate-400/30",
};

const statusLabels: Record<string, string> = {
  scheduled: "Planlandı",
  confirmed: "Onaylandı",
  cancelled: "İptal",
  completed: "Tamamlandı",
};

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

type View = "month" | "week" | "day";

export default function CalendarClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", endDate: "", type: "other" as string, notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const from = new Date(year, month - 1, 1).toISOString();
    const to = new Date(year, month + 2, 0).toISOString();
    try {
      const res = await fetch(`/api/appointments?from=${from}&to=${to}`);
      if (res.ok) setAppointments(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    // Previous month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Next month fill
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - startDow - lastDay.getDate() + 1);
      days.push({ date: d, isCurrentMonth: false });
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter((a) => a.date.split("T")[0] === dateStr);
  };

  const saveAppointment = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: new Date(form.date).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          type: form.type,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ title: "", date: "", endDate: "", type: "other", notes: "" });
        await fetchAppointments();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchAppointments();
  };

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Takvim</p>
          <h1 className="text-2xl font-semibold text-white">
            {MONTHS_TR[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10">
            {(["month", "week", "day"] as View[]).map((v, idx, arr) => (
              <button key={v} type="button" onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs ${idx === 0 ? "rounded-l-lg" : ""} ${idx === arr.length - 1 ? "rounded-r-lg" : ""} ${view === v ? "bg-lime-400 text-slate-950 font-semibold" : "text-slate-300 hover:bg-white/10"}`}>
                {v === "month" ? "Ay" : v === "week" ? "Hafta" : "Gün"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10">←</button>
            <button type="button" onClick={() => setCurrentDate(new Date())} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">Bugün</button>
            <button type="button" onClick={() => navigate(1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10">→</button>
          </div>
          <button type="button" onClick={() => setShowModal(true)}
            className="rounded-lg border border-lime-500 bg-lime-400 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]">
            + Randevu
          </button>
        </div>
      </div>

      {/* Month View */}
      {view === "month" && (
        <>
          {/* Desktop: 7-column grid */}
          <div className="hidden sm:block rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="grid grid-cols-7 gap-px">
              {DAYS_TR.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-semibold text-slate-400">{d}</div>
              ))}
              {getMonthDays().map((day, i) => {
                const dayAppts = getAppointmentsForDate(day.date);
                return (
                  <div key={i} className={`min-h-[80px] rounded-lg border p-1.5 text-xs ${
                    day.isCurrentMonth ? "border-white/5 bg-white/[0.02]" : "border-transparent opacity-40"
                  } ${isToday(day.date) ? "ring-1 ring-lime-400/50" : ""}`}>
                    <div className={`mb-1 text-right text-xs ${isToday(day.date) ? "font-bold text-lime-300" : "text-slate-400"}`}>
                      {day.date.getDate()}
                    </div>
                    {dayAppts.slice(0, 2).map((a) => (
                      <div key={a.id} className={`mb-0.5 truncate rounded px-1 py-0.5 text-[10px] ring-1 ${statusColors[a.status] || "bg-white/10 text-slate-300"}`}>
                        {a.title}
                      </div>
                    ))}
                    {dayAppts.length > 2 && <div className="text-[10px] text-slate-400">+{dayAppts.length - 2} daha</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: stacked day list */}
          <div className="sm:hidden space-y-1.5">
            {getMonthDays().filter((day) => day.isCurrentMonth).map((day, i) => {
              const dayAppts = getAppointmentsForDate(day.date);
              const hasAppts = dayAppts.length > 0;
              return (
                <div key={i} className={`rounded-xl border px-3 py-2 ${
                  isToday(day.date)
                    ? "border-lime-400/40 bg-lime-400/5 ring-1 ring-lime-400/30"
                    : hasAppts
                      ? "border-white/10 bg-white/5"
                      : "border-white/5 bg-white/[0.02]"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isToday(day.date) ? "text-lime-300" : "text-white"}`}>
                      {day.date.getDate()} {MONTHS_TR[day.date.getMonth()].slice(0, 3)},{" "}
                      {day.date.toLocaleDateString("tr-TR", { weekday: "short" })}
                    </span>
                    {hasAppts && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                        {dayAppts.length} randevu
                      </span>
                    )}
                  </div>
                  {hasAppts && (
                    <div className="mt-1.5 space-y-1">
                      {dayAppts.map((a) => (
                        <div key={a.id} className={`truncate rounded-lg px-2 py-1 text-xs ring-1 ${statusColors[a.status] || "bg-white/10 text-slate-300"}`}>
                          {new Date(a.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}{a.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Week / Day View */}
      {(view === "week" || view === "day") && (
        <div className="space-y-2">
          {loading ? (
            <div className="animate-pulse rounded-xl bg-white/5 p-6 h-40" />
          ) : (
            (() => {
              const daysToShow = view === "week" ? 7 : 1;
              const startOfWeek = new Date(currentDate);
              if (view === "week") {
                const dow = (startOfWeek.getDay() + 6) % 7;
                startOfWeek.setDate(startOfWeek.getDate() - dow);
              }
              return Array.from({ length: daysToShow }).map((_, i) => {
                const d = new Date(startOfWeek);
                d.setDate(d.getDate() + i);
                const dayAppts = getAppointmentsForDate(d);
                return (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className={`mb-2 text-sm font-semibold ${isToday(d) ? "text-lime-300" : "text-white"}`}>
                      {d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    {dayAppts.length === 0 ? (
                      <p className="text-xs text-slate-400">Randevu yok</p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayAppts.map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-white">{a.title}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(a.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                {" • "}{typeLabels[a.type] || a.type}
                                {a.customer && ` • ${a.customer.fullName}`}
                                {a.vehicleFile && ` • ${a.vehicleFile.vehicle.plate}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${statusColors[a.status]}`}>
                                {statusLabels[a.status]}
                              </span>
                              {a.status === "scheduled" && (
                                <button type="button" onClick={() => updateStatus(a.id, "confirmed")}
                                  className="rounded px-2 py-0.5 text-[10px] text-lime-300 ring-1 ring-lime-400/30 hover:bg-lime-400/10">Onayla</button>
                              )}
                              {a.status === "confirmed" && (
                                <button type="button" onClick={() => updateStatus(a.id, "completed")}
                                  className="rounded px-2 py-0.5 text-[10px] text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-400/10">Tamamla</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()
          )}
        </div>
      )}

      {/* New Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Yeni randevu" className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Yeni Randevu</h2>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Kapat" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="apt-title" className="mb-1 block text-xs text-slate-400">Başlık</label>
                <input id="apt-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="apt-date" className="mb-1 block text-xs text-slate-400">Başlangıç</label>
                  <input id="apt-date" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label htmlFor="apt-endDate" className="mb-1 block text-xs text-slate-400">Bitiş</label>
                  <input id="apt-endDate" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="apt-type" className="mb-1 block text-xs text-slate-400">Tür</label>
                <select id="apt-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white [&>option]:bg-slate-800 [&>option]:text-white">
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="apt-notes" className="mb-1 block text-xs text-slate-400">Not</label>
                <textarea id="apt-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10">Vazgeç</button>
                <button type="button" onClick={saveAppointment} disabled={saving}
                  className="rounded-md border border-lime-500 bg-lime-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
