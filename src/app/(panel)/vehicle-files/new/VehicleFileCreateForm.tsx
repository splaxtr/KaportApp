"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Option = { id: number; label: string; meta?: string };

type VehicleSuggestion = {
  id: number;
  plate: string;
  plateNormalized: string;
  lastVisitAt: string | null;
  filesCount: number;
  lastFile: {
    id: number;
    brandModel: string;
    color: string | null;
    customer: { id: number; fullName: string };
  } | null;
};
type CustomerSuggestion = { id: number; fullName: string; phones?: { phone: string }[] };
type ExpertSuggestion = { id: number; fullName: string; company: string | null; phone?: string | null };

export default function VehicleFileCreateForm() {
  const [createFile, setCreateFile] = useState(true);

  const [plate, setPlate] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [color, setColor] = useState("");
  const [accidentDate, setAccidentDate] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [quickNote, setQuickNote] = useState("");

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerSuggestion[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Option | null>(null);
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "" });
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  const [expertQuery, setExpertQuery] = useState("");
  const [expertOptions, setExpertOptions] = useState<ExpertSuggestion[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Option | null>(null);
  const [newExpert, setNewExpert] = useState({ fullName: "", phone: "", email: "", company: "" });
  const [showQuickExpert, setShowQuickExpert] = useState(false);

  const [vehicleOptions, setVehicleOptions] = useState<VehicleSuggestion[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchCustomers() {
      if (!customerQuery || customerQuery.length < 2) return;
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(customerQuery)}`, { signal: controller.signal });
        if (!res.ok) return;
        setCustomerOptions((await res.json()) as CustomerSuggestion[]);
      } catch (e) {
        if ((e as any).name === "AbortError") return;
      }
    }
    fetchCustomers();
    return () => controller.abort();
  }, [customerQuery]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchExperts() {
      if (!expertQuery || expertQuery.length < 2) return;
      try {
        const res = await fetch(`/api/experts?q=${encodeURIComponent(expertQuery)}`, { signal: controller.signal });
        if (!res.ok) return;
        setExpertOptions((await res.json()) as ExpertSuggestion[]);
      } catch (e) {
        if ((e as any).name === "AbortError") return;
      }
    }
    fetchExperts();
    return () => controller.abort();
  }, [expertQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      async function fetchVehicles() {
        if (!plate || plate.length < 2) return;
        try {
          const res = await fetch(`/api/vehicles?q=${encodeURIComponent(plate)}&limit=10`, { signal: controller.signal });
          if (!res.ok) return;
          setVehicleOptions((await res.json()) as VehicleSuggestion[]);
        } catch (e) {
          if ((e as any).name === "AbortError") return;
        }
      }
      fetchVehicles();
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [plate]);

  const filteredVehicleOptions = useMemo(() => vehicleOptions.slice(0, 5), [vehicleOptions]);
  const filteredCustomerOptions = useMemo(() => customerOptions.slice(0, 5), [customerOptions]);
  const filteredExpertOptions = useMemo(() => expertOptions.slice(0, 5), [expertOptions]);

  async function ensureCustomer(): Promise<number | null> {
    if (selectedCustomer) return selectedCustomer.id;
    if (newCustomer.fullName.trim() && newCustomer.phone.trim()) {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newCustomer.fullName.trim(),
          phones: [{ phone: newCustomer.phone.trim(), label: "Telefon" }],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Müşteri oluşturulamadı");
      }
      const data = await res.json();
      return data.id;
    }
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!plate.trim()) {
      setError("Plaka zorunludur.");
      return;
    }
    if (createFile && !brandModel.trim()) {
      setError("Araç marka/model zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const customerId = await ensureCustomer();
      if (!customerId) {
        setError("Müşteri seçin veya oluşturun.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/vehicle-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: plate.trim(),
          vehicleId: selectedVehicleId ?? undefined,
          brandModel: brandModel.trim(),
          color: color.trim() || undefined,
          accidentDate: accidentDate || undefined,
          fileNumber: fileNumber.trim() || undefined,
          quickNote: quickNote.trim() || undefined,
          customerId,
          expertId: selectedExpert?.id ?? undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Araç dosyası oluşturulamadı");
      }
      setSuccess("Araç dosyası oluşturuldu.");
      setPlate("");
      setBrandModel("");
      setColor("");
      setAccidentDate("");
      setFileNumber("");
      setQuickNote("");
      setSelectedCustomer(null);
      setSelectedExpert(null);
      setSelectedVehicleId(null);
      setNewCustomer({ fullName: "", phone: "" });
      setNewExpert({ fullName: "", phone: "", email: "", company: "" });
      setShowQuickCustomer(false);
      setShowQuickExpert(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araç Dosyası</p>
          <h1 className="text-3xl font-semibold">Yeni araç dosyası oluştur</h1>
          <p className="text-sm text-slate-300">Zorunlu alanlar: Plaka, Marka/Model, Araç sahibi.</p>
        </div>
        <Link
          href="/vehicles"
          className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
        >
          Geri dön
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-lime-500/40 bg-lime-500/10 px-4 py-3 text-sm text-lime-100">{success}</div>
      ) : null}

      <form className="space-y-4 rounded-2xl border border-white/15 bg-[#0f0f14] p-6 shadow-lg" onSubmit={onSubmit}>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={createFile}
            onChange={(e) => setCreateFile(e.target.checked)}
            className="h-4 w-4 rounded border-white/40 bg-white/10 text-lime-400 focus:ring-lime-400/70"
          />
          Bu plakaya araç dosyası aç
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="Plaka"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              required
            />
            {filteredVehicleOptions.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-black/60 text-xs text-slate-200 shadow-lg">
                {filteredVehicleOptions.map((v) => (
                  <button
                    key={v.plateNormalized}
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-white/10"
                    onMouseDown={() => {
                      setPlate(v.plate);
                      setSelectedVehicleId(v.id);
                      if (v.lastFile) {
                        setBrandModel(v.lastFile.brandModel);
                        setColor(v.lastFile.color ?? "");
                        setSelectedCustomer({
                          id: v.lastFile.customer.id,
                          label: v.lastFile.customer.fullName,
                        });
                      }
                      setVehicleOptions([]);
                    }}
                  >
                    {v.plate}{" "}
                    <span className="text-slate-400">
                      {v.lastVisitAt ? ` • Son geliş: ${new Date(v.lastVisitAt).toLocaleDateString("tr-TR")}` : ""}
                      {v.filesCount ? ` • Toplam: ${v.filesCount}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              value={brandModel}
              onChange={(e) => setBrandModel(e.target.value)}
              placeholder="Araç marka/model *"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              required
              disabled={!createFile}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Dosya No (opsiyonel)"
            value={fileNumber}
            onChange={(e) => setFileNumber(e.target.value)}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
            disabled={!createFile}
          />
          <input
            type="date"
            placeholder="gg.aa.yyyy"
            value={accidentDate}
            onChange={(e) => setAccidentDate(e.target.value)}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
            disabled={!createFile}
          />
        </div>

        <div className="space-y-3 rounded-lg border border-white/15 bg-[#121212] p-3">
          <details className="space-y-2" open>
            <summary className="cursor-pointer text-sm font-semibold text-white">Müşteri seç / ekle</summary>
            <input
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setSelectedCustomer(null);
              }}
              placeholder="Müşteri ara"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
            />
            {selectedCustomer ? <p className="text-[11px] text-lime-200">Seçili müşteri: {selectedCustomer.label}</p> : null}
            {filteredCustomerOptions.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-black/60 text-xs text-slate-200 shadow-lg">
                {filteredCustomerOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-white/10"
                    onMouseDown={() => {
                      setSelectedCustomer({
                        id: c.id,
                        label: c.fullName,
                        meta: c.phones && c.phones.length > 0 ? c.phones[0].phone : undefined,
                      });
                      setCustomerQuery(c.fullName);
                      setCustomerOptions([]);
                    }}
                  >
                    {c.fullName} {c.phones && c.phones.length > 0 ? `• ${c.phones[0].phone}` : ""}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400">
                <p>Hızlı müşteri ekle</p>
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer((p) => !p)}
                  className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:border-lime-300/60 hover:text-white"
                >
                  {showQuickCustomer ? "Gizle" : "Göster"}
                </button>
              </div>
              {showQuickCustomer ? (
                <>
                  <input
                    value={newCustomer.fullName}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Ad Soyad"
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                  />
                  <input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Telefon"
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">Seçim yoksa bu bilgilerle müşteri açılır.</p>
                </>
              ) : (
                <p className="text-[11px] text-slate-400">Yeni müşteri açmak için butona basın.</p>
              )}
            </div>
          </details>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Renk (opsiyonel)"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              disabled={!createFile}
            />
          </div>
          <div className="space-y-2">
            <input
              type="date"
              value={accidentDate}
              onChange={(e) => setAccidentDate(e.target.value)}
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              disabled={!createFile}
            />
          </div>
          <div className="space-y-2">
            <input
              value={fileNumber}
              onChange={(e) => setFileNumber(e.target.value)}
              placeholder="Dosya No (opsiyonel)"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
              disabled={!createFile}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-white/15 bg-[#121212] p-3">
          <details className="space-y-2">
            <summary className="cursor-pointer text-sm font-semibold text-white">Eksper seç / ekle (opsiyonel)</summary>
            <input
              value={expertQuery}
              onChange={(e) => {
                setExpertQuery(e.target.value);
                setSelectedExpert(null);
              }}
              placeholder="Eksper ara (opsiyonel)"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
            />
            {selectedExpert ? <p className="text-[11px] text-lime-200">Seçili: {selectedExpert.label}</p> : null}
            {filteredExpertOptions.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-black/60 text-xs text-slate-200 shadow-lg">
                {filteredExpertOptions.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-white/10"
                    onMouseDown={() => {
                      setSelectedExpert({
                        id: ex.id,
                        label: ex.fullName,
                        meta: ex.company ?? undefined,
                      });
                      setExpertQuery(ex.fullName);
                      setExpertOptions([]);
                    }}
                  >
                    {ex.fullName} {ex.company ? `• ${ex.company}` : ""} {ex.phone ? `• ${ex.phone}` : ""}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400">
                <p>Hızlı eksper ekle (opsiyonel)</p>
                <button
                  type="button"
                  onClick={() => setShowQuickExpert((p) => !p)}
                  className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:border-lime-300/60 hover:text-white"
                >
                  {showQuickExpert ? "Gizle" : "Göster"}
                </button>
              </div>
              {showQuickExpert ? (
                <>
                  <input
                    value={newExpert.fullName}
                    onChange={(e) => setNewExpert((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Ad Soyad"
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={newExpert.phone}
                      onChange={(e) => setNewExpert((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Telefon (opsiyonel)"
                      className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                    />
                    <input
                      type="email"
                      value={newExpert.email}
                      onChange={(e) => setNewExpert((p) => ({ ...p, email: e.target.value }))}
                      placeholder="E-posta (opsiyonel)"
                      className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                    />
                  </div>
                  <input
                    value={newExpert.company}
                    onChange={(e) => setNewExpert((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Firma (opsiyonel)"
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                  />
                </>
              ) : (
                <p className="text-[11px] text-slate-400">Eksper eklemek için butona basın.</p>
              )}
            </div>
          </details>
        </div>

        <div className="space-y-1">
        <textarea
          placeholder="Hızlı not (opsiyonel)"
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none sm:col-span-2"
          rows={3}
        />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/vehicles"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
          >
            Vazgeç
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
          >
            {submitting ? "Kaydediliyor..." : "Dosya oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}
