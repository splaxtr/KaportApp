import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { getShopVehicles, VehicleRow } from "@/lib/api/vehicles";

type Decoded = { role?: string; shopId?: string };

export default async function EmployeeVehicles() {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Araçlar</h1>
          <p className="text-sm text-muted-foreground">Sadece kendi şubenize ait araçlar listelenir.</p>
        </div>
      </div>
      {vehicles.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="py-8 text-sm text-muted-foreground text-center">
            Bu şubeye ait araç bulunamadı.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v: VehicleRow) => (
            <Card key={v.id} className="border border-border bg-card">
              <CardHeader className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-foreground">{v.plate}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>
                  {v.brand || "-"} {v.model || ""} {v.year ? `(${v.year})` : ""}
                </div>
                <div className="text-foreground">{v.package || "-"}</div>
                <div className="text-foreground">
                  Sahibi: {v.currentOwner?.name || "-"} {v.currentOwner?.phone ? `(${v.currentOwner.phone})` : ""}
                </div>
                <div className="text-foreground">
                  Dosya No: {v.cases?.[0]?.caseNumber || "-"} | Kaza:{" "}
                  {v.cases?.[0]?.damageDate
                    ? new Date(v.cases[0].damageDate as string).toLocaleDateString("tr-TR")
                    : "-"}
                </div>
                <div className="text-foreground">
                  Oluşturma: {v.createdAt ? new Date(v.createdAt).toLocaleDateString("tr-TR") : "-"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
