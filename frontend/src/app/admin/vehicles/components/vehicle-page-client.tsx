"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleFilters } from "./vehicle-filters";
import { VehicleTable } from "./vehicle-table";
import { VehicleListItem, VehicleListParams, getAdminVehicles } from "@/lib/api/admin/vehicles";

export default function VehiclePageClient({ token, initialData }: { token: string; initialData: VehicleListItem[] }) {
  const router = useRouter();
  const [data, setData] = useState<VehicleListItem[]>(initialData);

  const applyFilters = async (filters: VehicleListParams) => {
    const fresh = await getAdminVehicles(token, filters);
    setData(fresh);
    router.refresh();
  };

  const reset = async () => {
    const fresh = await getAdminVehicles(token);
    setData(fresh);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <VehicleFilters onApply={applyFilters} onReset={reset} />
      <VehicleTable initialData={data} />
    </div>
  );
}
