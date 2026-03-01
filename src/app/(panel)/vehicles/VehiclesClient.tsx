"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { normalizePlate } from "@/lib/plate";
import { MobileCard, MobileCardList, CardAction } from "@/components/MobileCard";

type Vehicle = {
  id: number;
  plate: string;
  plateNormalized: string;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  visitCount: number;
};

type VehicleFileCard = {
  id: number;
  plate: string;
  brandModel: string;
  color: string | null;
  customer: { id: number; fullName: string };
  status: string;
  quickNote: string | null;
  updatedAt: string;
};

type CustomerSuggestion = { id: number; fullName: string; phones?: { phone: string }[] };
type ExpertSuggestion = { id: number; fullName: string; company: string | null; phone: string | null };

const statusStyles: Record<string, string> = {
  open: "bg-sky-400 text-slate-950",
  pending: "bg-amber-300 text-slate-950",
  completed: "bg-lime-400 text-slate-950",
};

export default function VehiclesClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [files, setFiles] = useState<VehicleFileCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPlateOptions, setNewPlateOptions] = useState<Vehicle[]>([]);
  const [newPlateDropdown, setNewPlateDropdown] = useState(false);
  const [plateOptions, setPlateOptions] = useState<Vehicle[]>([]);
  const [plateDropdown, setPlateDropdown] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editPlate, setEditPlate] = useState("");

  const [createFile, setCreateFile] = useState(true);
  const [fileBrandModel, setFileBrandModel] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [fileAccidentDate, setFileAccidentDate] = useState("");
  const [fileQuickNote, setFileQuickNote] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerSuggestion[]>([]);
  const [customerDropdown, setCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; label: string } | null>(null);
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "", tcVkn: "" });
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [expertQuery, setExpertQuery] = useState("");
  const [expertOptions, setExpertOptions] = useState<ExpertSuggestion[]>([]);
  const [expertDropdown, setExpertDropdown] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<{ id: number; label: string } | null>(null);
  const [newExpert, setNewExpert] = useState({ fullName: "", phone: "", email: "", company: "" });
  const [showQuickExpert, setShowQuickExpert] = useState(false);

  const filteredVehicles = useMemo(() => vehicles, [vehicles]);
  const fileCards = useMemo(() => files, [files]);

  async function loadVehicles(query?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles${query ? `?q=${encodeURIComponent(query)}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Araçlar alınamadı");
      const data = (await res.json()) as Vehicle[];
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles() {
    try {
      const res = await fetch("/api/vehicle-files?status=open&limit=3", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as VehicleFileCard[];
      setFiles(data);
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    loadVehicles();
    loadFiles();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      async function fetchPlates() {
        if (!search || search.length < 2) {
          setPlateOptions([]);
          return;
        }
        try {
          const res = await fetch(`/api/vehicles?q=${encodeURIComponent(search)}&limit=10`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) return;
          const data = (await res.json()) as Vehicle[];
          setPlateOptions(data);
        } catch (e) {
          if ((e as any).name === "AbortError") return;
        }
      }
      fetchPlates();
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      async function fetchPlates() {
        if (!newPlate || newPlate.length < 2) {
          setNewPlateOptions([]);
          return;
        }
        try {
          const res = await fetch(`/api/vehicles?q=${encodeURIComponent(newPlate)}&limit=10`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) return;
          const data = (await res.json()) as Vehicle[];
          setNewPlateOptions(data);
        } catch (e) {
          if ((e as any).name === "AbortError") return;
        }
      }
      fetchPlates();
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [newPlate]);

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

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await loadVehicles(search);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    if (!newPlate.trim()) {
      setCreateError("Plaka zorunludur.");
      return;
    }
    if (createFile) {
      if (!fileBrandModel.trim()) {
        setCreateError("Araç marka/model zorunludur.");
        return;
      }
      if (!selectedCustomer && (!newCustomer.fullName.trim() || !newCustomer.phone.trim())) {
        setCreateError("Müşteri seçin veya ad/telefon girin.");
        return;
      }
    }
    setCreating(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: newPlate.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Araç oluşturulamadı");
      }
      const vehicle = await res.json();

      if (createFile) {
        let customerId = selectedCustomer?.id ?? null;
        if (!customerId) {
          const customerRes = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: newCustomer.fullName.trim(),
              phones: [{ phone: newCustomer.phone.trim(), label: "Telefon" }],
              tcVkn: newCustomer.tcVkn.trim() || undefined,
            }),
          });
          if (!customerRes.ok) {
            const body = await customerRes.json().catch(() => ({}));
            throw new Error(body?.error || "Müşteri oluşturulamadı");
          }
          const customer = await customerRes.json();
          customerId = customer.id;
        }

        let expertId = selectedExpert?.id ?? null;
        if (!expertId && newExpert.fullName.trim()) {
          const expertRes = await fetch("/api/experts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: newExpert.fullName.trim(),
              phone: newExpert.phone.trim() || undefined,
              email: newExpert.email.trim() || undefined,
              company: newExpert.company.trim() || undefined,
            }),
          });
          if (!expertRes.ok) {
            const body = await expertRes.json().catch(() => ({}));
            throw new Error(body?.error || "Eksper oluşturulamadı");
          }
          const expert = await expertRes.json();
          expertId = expert.id;
        }

        const fileRes = await fetch("/api/vehicle-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            plate: vehicle.plate,
            brandModel: fileBrandModel.trim(),
            customerId: customerId!,
            fileNumber: fileNumber.trim() || undefined,
            accidentDate: fileAccidentDate || undefined,
            quickNote: fileQuickNote.trim() || undefined,
            expertId: expertId ?? undefined,
          }),
        });
        if (!fileRes.ok) {
          const body = await fileRes.json().catch(() => ({}));
          throw new Error(body?.error || "Araç dosyası oluşturulamadı");
        }
      }

      setNewPlate("");
      setFileBrandModel("");
      setFileNumber("");
      setFileAccidentDate("");
      setFileQuickNote("");
      setSearch("");
      setSelectedCustomer(null);
      setSelectedExpert(null);
      setNewCustomer({ fullName: "", phone: "", tcVkn: "" });
      setNewExpert({ fullName: "", phone: "", email: "", company: "" });
      setShowQuickCustomer(false);
      setShowQuickExpert(false);
      setShowCreate(false);
      setCreateSuccess("Araç" + (createFile ? " ve dosya oluşturuldu." : " oluşturuldu."));
      await loadVehicles();
      await loadFiles();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setCreating(false);
    }
  }

  async function onDeleteVehicle(id: number) {
    if (!confirm("Bu aracı ve ilişkili dosyaları silmek istediğinize emin misiniz?")) return;
    setDeletingId(id);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Silme işlemi başarısız");
      }
      setCreateSuccess("Araç silindi.");
      await loadVehicles(search);
      await loadFiles();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setDeletingId(null);
    }
  }

  async function onEditVehicle(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    if (!editPlate.trim()) {
      setCreateError("Plaka zorunludur.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const res = await fetch(`/api/vehicles/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: editPlate.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Güncelleme başarısız");
      }
      setCreateSuccess("Araç güncellendi.");
      setEditId(null);
      setEditPlate("");
      await loadVehicles(search);
      await loadFiles();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araçlar</p>
          <h1 className="text-3xl font-semibold">Araç yönetimi</h1>
          <p className="text-sm text-slate-300">
            Plaka bazlı arama, geçmiş geliş sayısı ve araç dosyalarına hızlı erişim.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onSearch}>
            <div className="relative">
              <input
                type="search"
                placeholder="Plaka ile ara"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPlateDropdown(true);
                }}
                onFocus={() => plateOptions.length > 0 && setPlateDropdown(true)}
                onBlur={() => setTimeout(() => setPlateDropdown(false), 100)}
                className="w-64 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-lime-300/70 focus:outline-none"
              />
              {plateDropdown && plateOptions.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-black/70 text-xs text-slate-200 shadow-lg">
                  {plateOptions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-white/10"
                      onClick={() => {
                        setSearch(v.plate);
                        setPlateDropdown(false);
                        loadVehicles(v.plate);
                      }}
                    >
                      {v.plate}{" "}
                      <span className="text-slate-400">
                        {v.lastVisitAt ? `• Son geliş: ${new Date(v.lastVisitAt).toLocaleDateString("tr-TR")}` : ""}{" "}
                        {v.visitCount ? `• Toplam: ${v.visitCount}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]"
            >
              Ara
            </button>
          </form>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg border border-lime-300/60 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] sm:ml-2"
          >
            Yeni araç
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}
      {createSuccess ? (
        <div className="rounded-lg border border-lime-500/40 bg-lime-500/10 px-4 py-3 text-sm text-lime-100">
          {createSuccess}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3">Plaka</th>
              <th className="px-4 py-3">İlk geliş tarihi</th>
              <th className="px-4 py-3">Son geliş tarihi</th>
              <th className="px-4 py-3">Toplam geliş sayısı</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-300">
                  Yükleniyor...
                </td>
              </tr>
            ) : filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-300">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{v.plate}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {v.firstVisitAt ? new Date(v.firstVisitAt).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {v.lastVisitAt ? new Date(v.lastVisitAt).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">{v.visitCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      <Link
                        href={`/vehicles/${encodeURIComponent(normalizePlate(v.plate))}`}
                        className="rounded-lg border border-white/10 px-3 py-1 text-slate-200 transition hover:border-lime-300/70 hover:text-white"
                      >
                        Dosyalara git
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(v.id);
                          setEditPlate(v.plate);
                        }}
                        className="rounded-lg border border-white/10 px-3 py-1 text-slate-200 transition hover:border-lime-300/70 hover:text-white"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteVehicle(v.id)}
                        disabled={deletingId === v.id}
                        className="rounded-lg border border-red-500/50 px-3 py-1 text-red-200 transition hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {deletingId === v.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araç Dosyaları</p>
            <h3 className="text-xl font-semibold">Bu araçlara ait dosyalar</h3>
          </div>
          <Link
            href="/vehicle-files/new"
            className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]"
          >
            Dosya aç
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {fileCards.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 lg:col-span-3">
              Dosya bulunamadı.
            </div>
          ) : (
            fileCards.map((file) => (
              <div
                key={file.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg hover:border-lime-300/70"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Plaka</p>
                    <p className="text-lg font-semibold text-white">{file.plate}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[file.status] || "bg-white/10"}`}>
                    {file.status}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-200">
                  <p className="font-semibold">{file.brandModel}</p>
                  <p>{file.color ?? "—"}</p>
                  <p className="text-slate-300">Müşteri: {file.customer.fullName}</p>
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                  {file.quickNote ?? "—"}
                </div>
                <div className="mt-4 flex gap-2 text-xs text-slate-200">
                  <Link
                    href={`/vehicles/${encodeURIComponent(normalizePlate(file.plate))}/${file.id}`}
                    className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-center transition hover:border-lime-300/70 hover:text-white"
                  >
                    Detay
                  </Link>
                  <Link
                    href={`/vehicles/${encodeURIComponent(normalizePlate(file.plate))}/${file.id}`}
                    className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-center transition hover:border-lime-300/70 hover:text-white"
                  >
                    Parçalar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Yeni araç</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form className="space-y-3" onSubmit={onCreate}>
              <input
                type="text"
                placeholder="Plaka"
                value={newPlate}
                onChange={(e) => {
                  setNewPlate(e.target.value.toUpperCase());
                  setNewPlateDropdown(true);
                }}
                onFocus={() => newPlateOptions.length > 0 && setNewPlateDropdown(true)}
                onBlur={() => setTimeout(() => setNewPlateDropdown(false), 100)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                required
              />
              {newPlateDropdown && newPlateOptions.length > 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/70 text-xs text-slate-200 shadow-lg">
                  {newPlateOptions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-white/10"
                      onClick={() => {
                        setNewPlate(v.plate);
                        setNewPlateDropdown(false);
                      }}
                    >
                      {v.plate}{" "}
                      <span className="text-slate-400">
                        {v.lastVisitAt ? `• Son geliş: ${new Date(v.lastVisitAt).toLocaleDateString("tr-TR")}` : ""}{" "}
                        {v.visitCount ? `• Toplam: ${v.visitCount}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={createFile}
                    onChange={(e) => setCreateFile(e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60"
                  />
                  Bu plakaya araç dosyası aç
                </label>
                {createFile ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Araç marka/model *"
                      value={fileBrandModel}
                      onChange={(e) => setFileBrandModel(e.target.value)}
                      className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none sm:col-span-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Dosya No (opsiyonel)"
                      value={fileNumber}
                      onChange={(e) => setFileNumber(e.target.value)}
                      className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                    />
                    <input
                      type="date"
                      placeholder="Kaza Tarihi (opsiyonel)"
                      value={fileAccidentDate}
                      onChange={(e) => setFileAccidentDate(e.target.value)}
                      className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                    />
                    <details className="space-y-1 sm:col-span-2 rounded-lg border border-white/10 bg-white/5 p-3" open>
                      <summary className="cursor-pointer text-sm font-semibold text-white">Müşteri seç / ekle</summary>
                      <div className="space-y-1">
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
                                onMouseDown={() => {
                                  setSelectedCustomer({
                                    id: c.id,
                                    label: c.fullName,
                                  });
                                  setCustomerQuery(c.fullName);
                                  setCustomerDropdown(false);
                                  setCustomerOptions([]);
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
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  placeholder="TC / VKN (opsiyonel)"
                                  value={newCustomer.tcVkn}
                                  onChange={(e) => setNewCustomer((p) => ({ ...p, tcVkn: e.target.value }))}
                                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Telefon"
                                  value={newCustomer.phone}
                                  onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                                />
                              </div>
                              <p className="text-[11px] text-slate-400">Seçim yoksa bu bilgilerle müşteri açılır.</p>
                            </>
                          ) : (
                            <p className="text-[11px] text-slate-400">Yeni müşteri açmak için butona basın.</p>
                          )}
                        </div>
                      </div>
                    </details>
                    <details className="space-y-1 sm:col-span-2 rounded-lg border border-white/10 bg-white/5 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-white">Eksper seç / ekle (opsiyonel)</summary>
                      <div className="space-y-1">
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
                              <p className="text-[11px] text-slate-400">Seçim yoksa isteğe bağlı eksper açılır.</p>
                            </>
                          ) : (
                            <p className="text-[11px] text-slate-400">Eksper eklemek için butona basın.</p>
                          )}
                        </div>
                      </div>
                    </details>
                    <textarea
                      placeholder="Hızlı not (opsiyonel)"
                      value={fileQuickNote}
                      onChange={(e) => setFileQuickNote(e.target.value)}
                      className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none sm:col-span-2"
                      rows={2}
                    />
                  </div>
                ) : null}
              </div>
              {createError ? (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  {createError}
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {creating ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Araç düzenle</h3>
              <button
                onClick={() => {
                  setEditId(null);
                  setEditPlate("");
                }}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form className="space-y-3" onSubmit={onEditVehicle}>
              <input
                type="text"
                placeholder="Plaka"
                value={editPlate}
                onChange={(e) => setEditPlate(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setEditPlate("");
                  }}
                  className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md border border-lime-500 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {creating ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
