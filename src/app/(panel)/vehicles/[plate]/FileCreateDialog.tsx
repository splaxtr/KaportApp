"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type CustomerSuggestion = { id: number; fullName: string; phones?: { phone: string }[] };
type ExpertSuggestion = { id: number; fullName: string; company: string | null; phone: string | null };

type Props = {
  plate: string;
};

export default function FileCreateDialog({ plate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brandModel, setBrandModel] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [accidentDate, setAccidentDate] = useState("");
  const [quickNote, setQuickNote] = useState("");

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerSuggestion[]>([]);
  const [customerDropdown, setCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; label: string } | null>(null);
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "" });
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  const [expertQuery, setExpertQuery] = useState("");
  const [expertOptions, setExpertOptions] = useState<ExpertSuggestion[]>([]);
  const [expertDropdown, setExpertDropdown] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<{ id: number; label: string } | null>(null);
  const [newExpert, setNewExpert] = useState({ fullName: "", phone: "", email: "", company: "" });
  const [showQuickExpert, setShowQuickExpert] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      async function fetchCustomers() {
        if (!customerQuery || customerQuery.length < 2) {
          setCustomerOptions([]);
          return;
        }
        try {
          const res = await fetch(`/api/customers?q=${encodeURIComponent(customerQuery)}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) return;
          const data = (await res.json()) as CustomerSuggestion[];
          setCustomerOptions(data);
        } catch (e) {
          if ((e as any).name === "AbortError") return;
        }
      }
      fetchCustomers();
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [customerQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      async function fetchExperts() {
        if (!expertQuery || expertQuery.length < 2) {
          setExpertOptions([]);
          return;
        }
        try {
          const res = await fetch(`/api/experts?q=${encodeURIComponent(expertQuery)}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) return;
          const data = (await res.json()) as ExpertSuggestion[];
          setExpertOptions(data);
        } catch (e) {
          if ((e as any).name === "AbortError") return;
        }
      }
      fetchExperts();
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [expertQuery]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!brandModel.trim()) {
      setError("Araç marka/model zorunludur.");
      return;
    }
    if (!selectedCustomer && (!newCustomer.fullName.trim() || !newCustomer.phone.trim())) {
      setError("Müşteri seçin veya ad/telefon girin.");
      return;
    }
    setLoading(true);
    try {
      let customerId = selectedCustomer?.id ?? null;
      if (!customerId) {
        const cRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: newCustomer.fullName.trim(),
            phones: [{ phone: newCustomer.phone.trim(), label: "Telefon" }],
          }),
        });
        if (!cRes.ok) {
          const body = await cRes.json().catch(() => ({}));
          throw new Error(body?.error || "Müşteri oluşturulamadı");
        }
        const c = await cRes.json();
        customerId = c.id;
      }

      let expertId = selectedExpert?.id ?? null;
      if (!expertId && newExpert.fullName.trim()) {
        const exRes = await fetch("/api/experts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: newExpert.fullName.trim(),
            phone: newExpert.phone.trim() || undefined,
            email: newExpert.email.trim() || undefined,
            company: newExpert.company.trim() || undefined,
          }),
        });
        if (!exRes.ok) {
          const body = await exRes.json().catch(() => ({}));
          throw new Error(body?.error || "Eksper oluşturulamadı");
        }
        const ex = await exRes.json();
        expertId = ex.id;
      }

      const res = await fetch("/api/vehicle-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate,
          brandModel: brandModel.trim(),
          customerId: customerId!,
          fileNumber: fileNumber.trim() || undefined,
          accidentDate: accidentDate || undefined,
          quickNote: quickNote.trim() || undefined,
          expertId: expertId ?? undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Dosya oluşturulamadı");
      }
      setInfo("Dosya oluşturuldu.");
      setOpen(false);
      setBrandModel("");
      setFileNumber("");
      setAccidentDate("");
      setQuickNote("");
      setCustomerQuery("");
      setCustomerOptions([]);
      setSelectedCustomer(null);
      setNewCustomer({ fullName: "", phone: "" });
      setExpertQuery("");
      setExpertOptions([]);
      setSelectedExpert(null);
      setNewExpert({ fullName: "", phone: "", email: "", company: "" });
      setShowQuickCustomer(false);
      setShowQuickExpert(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]"
      >
        Dosya aç
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f14] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Bu plakaya araç dosyası aç</h3>
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

            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                Plaka: <span className="font-semibold text-white">{plate}</span>
              </div>
              <input
                type="text"
                placeholder="Araç marka/model *"
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                required
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Dosya No (opsiyonel)"
                  value={fileNumber}
                  onChange={(e) => setFileNumber(e.target.value)}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                />
                <input
                  type="date"
                  placeholder="gg.aa.yyyy"
                  value={accidentDate}
                  onChange={(e) => setAccidentDate(e.target.value)}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                />
              </div>

              <div className="space-y-2 rounded-lg border border-white/15 bg-black/40 p-3">
                <details className="space-y-2" open>
                  <summary className="cursor-pointer text-sm font-semibold text-white">Müşteri seç / ekle</summary>
                  <input
                    type="text"
                    placeholder="Müşteri ara"
                    value={customerQuery}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setSelectedCustomer(null);
                      setCustomerDropdown(true);
                    }}
                    onFocus={() => customerOptions.length > 0 && setCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setCustomerDropdown(false), 100)}
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                  />
                  {selectedCustomer ? (
                    <p className="text-[11px] text-lime-200">Seçili müşteri: {selectedCustomer.label}</p>
                  ) : null}
                  {customerDropdown && customerOptions.length > 0 ? (
                    <div className="rounded-lg border border-white/10 bg-black/70 text-xs text-slate-200 shadow-lg">
                      {customerOptions.slice(0, 5).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="block w-full px-3 py-2 text-left hover:bg-white/10"
                          onClick={() => {
                            setSelectedCustomer({
                              id: c.id,
                              label: c.fullName,
                            });
                            setCustomerQuery(c.fullName);
                            setCustomerDropdown(false);
                          }}
                        >
                          {c.fullName} {c.phones && c.phones.length > 0 ? `• ${c.phones[0].phone}` : ""}
                        </button>
                      ))}
                    </div>
                  ) : null}
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
                          type="text"
                          placeholder="Ad Soyad"
                          value={newCustomer.fullName}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, fullName: e.target.value }))}
                          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Telefon"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-400">Seçim yoksa bu bilgilerle müşteri açılır.</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">Yeni müşteri açmak için butona basın.</p>
                    )}
                  </div>
                </details>

                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-semibold text-white">Eksper seç / ekle (opsiyonel)</summary>
                  <input
                    type="text"
                    placeholder="Eksper ara (opsiyonel)"
                    value={expertQuery}
                    onChange={(e) => {
                      setExpertQuery(e.target.value);
                      setSelectedExpert(null);
                      setExpertDropdown(true);
                    }}
                    onFocus={() => expertOptions.length > 0 && setExpertDropdown(true)}
                    onBlur={() => setTimeout(() => setExpertDropdown(false), 100)}
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                  />
                  {selectedExpert ? (
                    <p className="text-[11px] text-lime-200">Seçili eksper: {selectedExpert.label}</p>
                  ) : null}
                  {expertDropdown && expertOptions.length > 0 ? (
                    <div className="rounded-lg border border-white/10 bg-black/70 text-xs text-slate-200 shadow-lg">
                        {expertOptions.slice(0, 5).map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            className="block w-full px-3 py-2 text-left hover:bg-white/10"
                            onMouseDown={() => {
                              setSelectedExpert({
                                id: ex.id,
                                label: ex.fullName,
                              });
                              setExpertQuery(ex.fullName);
                              setExpertDropdown(false);
                              setExpertOptions([]);
                            }}
                          >
                            {ex.fullName} {ex.company ? `• ${ex.company}` : ""} {ex.phone ? `• ${ex.phone}` : ""}
                          </button>
                        ))}
                    </div>
                  ) : null}
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
                          type="text"
                          placeholder="Ad Soyad"
                          value={newExpert.fullName}
                          onChange={(e) => setNewExpert((p) => ({ ...p, fullName: e.target.value }))}
                          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            placeholder="Telefon (opsiyonel)"
                            value={newExpert.phone}
                            onChange={(e) => setNewExpert((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                          />
                          <input
                            type="email"
                            placeholder="E-posta (opsiyonel)"
                            value={newExpert.email}
                            onChange={(e) => setNewExpert((p) => ({ ...p, email: e.target.value }))}
                            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Firma (opsiyonel)"
                          value={newExpert.company}
                          onChange={(e) => setNewExpert((p) => ({ ...p, company: e.target.value }))}
                          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-400">Eksper eklemek için butona basın.</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">Eksper eklemek için butona basın.</p>
                    )}
                  </div>
                </details>
              </div>

              <textarea
                placeholder="Hızlı not (opsiyonel)"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                rows={3}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
