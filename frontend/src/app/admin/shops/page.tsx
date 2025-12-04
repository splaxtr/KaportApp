import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateShopDialog } from "./components/create-shop-dialog";
import { ShopsTable } from "./components/shops-table";
import { getShops } from "@/lib/api/shops";

type Decoded = { role?: string };

export default async function AdminShopsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const shops = await getShops(token);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Şubeler</h1>
          <p className="text-sm text-muted-foreground">Şubeleri ve sahiplerini yönetin</p>
        </div>
        <CreateShopDialog token={token} />
      </div>

      <ShopsTable data={shops} />

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Notlar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Şubeler oluşturun ve sahip atayın. Kullanıcı/araç sayıları backend tarafındaki agregasyon verilerine bağlıdır.
        </CardContent>
      </Card>
    </div>
  );
}
