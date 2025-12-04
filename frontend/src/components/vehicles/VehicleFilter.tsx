"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Default to backend dev port (3001) if env not provided
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const STATUSES = ["All", "In Progress", "Waiting Parts", "Completed"];

type BrandOption = { name: string; isCustom?: boolean };
type ModelOption = { name: string; isCustom?: boolean };
type YearOption = { year: number; isCustom?: boolean };

type Filters = {
  brand?: string;
  model?: string;
  year?: number;
  status?: string;
  plate?: string;
};

type Props = {
  shopId: string;
  onChange: (filters: Filters) => void;
};

type ModalMode = "brand" | "model" | "year";

export function VehicleFilter({ shopId, onChange }: Props) {
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [years, setYears] = useState<YearOption[]>([]);
  const [filters, setFilters] = useState<Filters>({ status: "All" });
  const [loading, setLoading] = useState<{ brand?: boolean; model?: boolean; year?: boolean }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("brand");
  const [modalData, setModalData] = useState<{ brand: string; model: string; year?: number }>({ brand: "", model: "" });
  const [noResultMode, setNoResultMode] = useState<ModalMode | null>(null);

  const sortedBrands = useMemo(() => sortCustom(brands, (b) => !!b.isCustom), [brands]);
  const sortedModels = useMemo(() => sortCustom(models, (m) => !!m.isCustom), [models]);
  const sortedYears = useMemo(() => sortCustom(years, (y) => !!y.isCustom), [years]);

  useEffect(() => {
    fetchBrands();
  }, [shopId]);

  useEffect(() => {
    onChange(filters);
  }, [filters, onChange]);

  useEffect(() => {
    if (filters.brand) fetchModels(filters.brand);
    else setModels([]);
    setFilters((f) => ({ ...f, model: undefined, year: undefined }));
  }, [filters.brand]);

  useEffect(() => {
    if (filters.brand && filters.model) fetchYears(filters.brand, filters.model);
    else setYears([]);
    setFilters((f) => ({ ...f, year: undefined }));
  }, [filters.model]);

  const fetchBrands = async () => {
    setLoading((s) => ({ ...s, brand: true }));
    try {
      const res = await fetch(`${API_BASE}/vehicles/catalog/brands?shopId=${shopId}`);
      const data = await res.json();
      setBrands(data ?? []);
    } catch (_) {
      setBrands([]);
    } finally {
      setLoading((s) => ({ ...s, brand: false }));
    }
  };

  const fetchModels = async (brand: string) => {
    setLoading((s) => ({ ...s, model: true }));
    try {
      const res = await fetch(
        `${API_BASE}/vehicles/catalog/models?shopId=${shopId}&brand=${encodeURIComponent(brand)}`,
      );
      const data = await res.json();
      if (!data?.length) {
        setNoResultMode("model");
        openModal("model", brand);
      }
      setModels(data ?? []);
    } catch (_) {
      setModels([]);
    } finally {
      setLoading((s) => ({ ...s, model: false }));
    }
  };

  const fetchYears = async (brand: string, model: string) => {
    setLoading((s) => ({ ...s, year: true }));
    try {
      const res = await fetch(
        `${API_BASE}/vehicles/catalog/years?shopId=${shopId}&brand=${encodeURIComponent(
          brand,
        )}&model=${encodeURIComponent(model)}`,
      );
      const data = await res.json();
      if (!data?.length) {
        setNoResultMode("year");
        openModal("year", brand, model);
      }
      setYears(data ?? []);
    } catch (_) {
      setYears([]);
    } finally {
      setLoading((s) => ({ ...s, year: false }));
    }
  };

  const openModal = (mode: ModalMode, brand?: string, model?: string) => {
    setModalMode(mode);
    setModalData({ brand: brand || filters.brand || "", model: model || filters.model || "" });
    setModalOpen(true);
  };

  const submitCustom = async () => {
    const payload: any = {
      shopId,
      brand: modalData.brand,
      model: modalMode !== "brand" ? modalData.model : undefined,
      year: modalMode === "year" ? modalData.year : undefined,
    };
    await fetch(`${API_BASE}/vehicles/catalog/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setModalOpen(false);
    if (modalMode === 'brand') fetchBrands();
    if (modalMode === 'model' && payload.brand) fetchModels(payload.brand);
    if (modalMode === 'year' && payload.brand && payload.model) fetchYears(payload.brand, payload.model);
  };

  return (
    <div className="rounded-lg border border-border bg-card/80 backdrop-blur shadow-lg shadow-black/10 p-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-5">
        <SelectBox
          label="Brand"
          placeholder="Select brand"
          loading={!!loading.brand}
          value={filters.brand}
          onChange={(v) => setFilters((f) => ({ ...f, brand: v || undefined }))}
          options={sortedBrands.map((b) => ({ value: b.name, label: b.name, isCustom: b.isCustom }))}
          onAdd={() => openModal('brand')}
        />

        <SelectBox
          label="Model"
          placeholder="Select model"
          loading={!!loading.model}
          value={filters.model}
          disabled={!filters.brand}
          onChange={(v) => setFilters((f) => ({ ...f, model: v || undefined }))}
          options={sortedModels.map((m) => ({ value: m.name, label: m.name, isCustom: m.isCustom }))}
          onAdd={() => openModal('model')}
        />

        <SelectBox
          label="Year"
          placeholder="Select year"
          loading={!!loading.year}
          value={filters.year?.toString()}
          disabled={!filters.model}
          onChange={(v) => setFilters((f) => ({ ...f, year: v ? parseInt(v, 10) : undefined }))}
          options={sortedYears.map((y) => ({ value: y.year.toString(), label: y.year.toString(), isCustom: y.isCustom }))}
          onAdd={() => openModal('year')}
        />

        <SelectBox
          label="Status"
          placeholder="Status"
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v || 'All' }))}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Plate</label>
          <Input
            placeholder="Search plate"
            value={filters.plate || ''}
            onChange={(e) => setFilters((f) => ({ ...f, plate: e.target.value }))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Button variant="outline" size="sm" onClick={() => openModal('brand')}>
          + Add Brand
        </Button>
        <Button variant="outline" size="sm" onClick={() => openModal('model')} disabled={!filters.brand}>
          + Add Model
        </Button>
        <Button variant="outline" size="sm" onClick={() => openModal('year')} disabled={!filters.model}>
          + Add Year
        </Button>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title={`Add ${modalMode}`}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Brand</label>
              <Input
                value={modalData.brand}
                onChange={(e) => setModalData((d) => ({ ...d, brand: e.target.value }))}
                placeholder="Brand"
              />
            </div>
            {modalMode !== 'brand' && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Model</label>
                <Input
                  value={modalData.model}
                  onChange={(e) => setModalData((d) => ({ ...d, model: e.target.value }))}
                  placeholder="Model"
                />
              </div>
            )}
            {modalMode === 'year' && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Year</label>
                <Input
                  type="number"
                  value={modalData.year || ''}
                  onChange={(e) => setModalData((d) => ({ ...d, year: parseInt(e.target.value, 10) || undefined }))}
                  placeholder="Year"
                />
              </div>
            )}
            {noResultMode === modalMode && (
              <p className="text-xs text-amber-400">No results found. Add {modalMode}?</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={submitCustom}>Save</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function sortCustom<T>(arr: T[], isCustom: (item: T) => boolean): T[] {
  const customs = arr.filter((i) => isCustom(i));
  const rest = arr.filter((i) => !isCustom(i));
  return [...customs, ...rest];
}

type SelectBoxProps = {
  label: string;
  placeholder: string;
  options: { value: string; label: string; isCustom?: boolean }[];
  value?: string;
  onChange: (val: string | null) => void;
  onAdd?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function SelectBox({ label, placeholder, options, value, onChange, disabled, loading }: SelectBoxProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">{label}</label>
      <Select
        disabled={disabled}
        value={value ?? "__any__"}
        onValueChange={(v) => onChange(v === "__any__" ? null : v)}
      >
        <SelectTrigger className="rounded-lg border-border bg-card/70 backdrop-blur-sm shadow-sm">
          <SelectValue placeholder={placeholder} />
          {loading && <span className="ml-2 text-xs text-muted-foreground">Loading</span>}
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <SelectItem value="__any__">{`Any ${label.toLowerCase()}`}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <div className="flex items-center gap-2">
                <span>{o.label}</span>
                {o.isCustom && <Badge variant="outline">Custom</Badge>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type ModalProps = { title: string; children: React.ReactNode; onClose: () => void };
function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
