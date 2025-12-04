import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getVehicles } from "@/lib/api/vehicles";
import { VehiclesTable } from "./components/vehicles-table";
import { VehicleFilters } from "@/lib/api/vehicles";

type Decoded = { role?: string };

export default async function AdminVehicles() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const vehicles = await getVehicles(token, {} as VehicleFilters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Search, filter, and edit vehicles.</p>
        </div>
      </div>
      <VehiclesTable initialData={vehicles} token={token} />
    </div>
  );
}
