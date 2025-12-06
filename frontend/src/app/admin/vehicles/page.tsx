import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getAdminVehicles } from "@/lib/api/admin/vehicles";
import VehiclePageClient from "./components/vehicle-page-client";

type Decoded = { role?: string };

export default async function AdminVehicles() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const vehicles = await getAdminVehicles(token);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Araçlar</h1>
          <p className="text-sm text-muted-foreground">Ara, filtrele, görüntüle.</p>
        </div>
      </div>
      <VehiclePageClient token={token} initialData={vehicles} />
    </div>
  );
}
