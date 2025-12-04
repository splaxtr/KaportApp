import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getVehicle, getVehicleActivity, getCaseParts, getCasePhotos, getCaseTasks } from "@/lib/api/vehicles";
import { VehicleHeader } from "./components/vehicle-header";
import { VehicleTabs } from "./components/vehicle-tabs";

type Decoded = { role?: string };

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const [vehicle, activity] = await Promise.all([getVehicle(id, token, true).catch(() => null), getVehicleActivity(id, token)]);
  if (!vehicle) redirect("/admin/vehicles");
  const activeCaseId = vehicle.cases?.[0]?.id;
  const shopId = vehicle.shop?.id || undefined;
  const [parts, photos, tasks] = activeCaseId
    ? await Promise.all([
        getCaseParts(activeCaseId, token),
        getCasePhotos(activeCaseId, token),
        getCaseTasks(activeCaseId, token),
      ])
    : [[], [], []];

  return (
    <div className="space-y-4">
      <VehicleHeader vehicle={vehicle} token={token} />
      <VehicleTabs
        vehicle={vehicle}
        caseId={activeCaseId}
        shopId={shopId}
        parts={parts}
        photos={photos}
        activity={activity}
        tasks={tasks}
        token={token}
      />
    </div>
  );
}
