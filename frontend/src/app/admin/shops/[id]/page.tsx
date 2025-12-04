import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getShop } from "@/lib/api/shops";
import { EditShopDialog } from "../components/edit-shop-dialog";
import { AssignUsersDialog } from "../components/assign-users-dialog";

type Decoded = { role?: string };

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const shop = await getShop(id, token).catch(() => null);
  if (!shop) redirect("/admin/shops");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{shop.name}</h1>
          <p className="text-sm text-muted-foreground">Sahip: {shop.owner?.name || shop.owner?.email || "Bilinmiyor"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Aktif</Badge>
          <EditShopDialog token={token} shop={{ id: shop.id, name: shop.name, ownerId: shop.owner?.id }} />
          <AssignUsersDialog shopId={shop.id} token={token} />
        </div>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Detaylar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-xs uppercase text-muted-foreground">Şube ID</div>
            <div className="text-sm text-foreground break-all">{shop.id}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-xs uppercase text-muted-foreground">Sahip</div>
            <div className="text-sm text-foreground">{shop.owner?.name || shop.owner?.email || "Bilinmiyor"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
