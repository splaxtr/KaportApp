import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getAdminVehicleDetail } from "@/lib/api/admin/vehicle-detail";
import VehicleDetailClient from "./components/vehicle-detail-client";

type Decoded = { role?: string };

export default async function AdminVehicleDetailPage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const vehicle = await getAdminVehicleDetail(id, token);
  if (!vehicle) redirect("/admin/vehicles");

  return (
    <div className="space-y-4">
      <VehicleDetailClient token={token} vehicle={vehicle} />
    </div>
  );
}
