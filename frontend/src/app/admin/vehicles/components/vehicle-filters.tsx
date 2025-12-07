"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleListParams } from "@/lib/api/admin/vehicles";

type Props = {
  onApply: (filters: VehicleListParams) => void;
  onReset: () => void;
};

export function VehicleFilters({ onApply, onReset }: Props) {
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [shopId, setShopId] = useState("all");

  const handleApply = () => {
    const filters: VehicleListParams = {
      plate: plate || undefined,
      brand: brand || undefined,
      model: model || undefined,
      year: year ? Number(year) : undefined,
      shopId: shopId === "all" ? undefined : shopId,
    };
    onApply(filters);
  };

  const handleReset = () => {
    setPlate("");
    setBrand("");
    setModel("");
    setYear("");
    setShopId("all");
    onReset();
  };

  return (
    <Card className="border border-border bg-card p-4 w-full">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="space-y-1">
          <Label>Plaka</Label>
          <Input placeholder="34ABC123" value={plate} onChange={(e) => setPlate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Marka</Label>
          <Input placeholder="Fiat" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Model</Label>
          <Input placeholder="Doblo" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Yıl</Label>
          <Input placeholder="2024" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Şube (opsiyonel)</Label>
          <Select value={shopId} onValueChange={setShopId}>
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="demo-shop-id">Demo Shop</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={handleApply}>Ara</Button>
        <Button variant="outline" onClick={handleReset}>
          Sıfırla
        </Button>
      </div>
    </Card>
  );
}
