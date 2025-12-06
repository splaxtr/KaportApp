"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { VehicleDetail } from "@/lib/api/admin/vehicle-detail";
import VehicleHeader from "./vehicle-header";
import CaseTable from "./case-table";
import NewCaseDialog from "./new-case-dialog";

export default function VehicleDetailClient({ vehicle, token }: { vehicle: VehicleDetail; token: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState<VehicleDetail>(vehicle);

  const handleCreated = (next: VehicleDetail) => {
    setCurrent(next);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <VehicleHeader vehicle={current} />
          <NewCaseDialog vehicleId={current.id} token={token} onCreated={handleCreated} />
        </div>
      </Card>

      <CaseTable cases={current.cases || []} />
    </div>
  );
}
