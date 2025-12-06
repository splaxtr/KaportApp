import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getShopVehicles } from "@/lib/api/vehicles";
import { VehiclesClient } from "./components/vehicles-client";

type Decoded = { role?: string; shopId?: string };

export default async function OwnerVehicles() {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  const shopId = decoded.shopId;
  if (!shopId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Araçlar</h1>
        <p className="text-sm text-muted-foreground">Bu hesap için tanımlı bir şube bulunamadı.</p>
      </div>
    );
  }

  const vehicles = await getShopVehicles(token, shopId, {});
  return <VehiclesClient vehicles={vehicles} token={token} shopId={shopId} />;
}
