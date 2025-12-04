import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Vehicle = { id: string; plate: string; customerName?: string | null; shopId?: string };
type Part = { id: string; vehicleId: string; name: string; statusKey?: string | null; quantity?: number | null };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function fetchVehicles(token: string): Promise<Vehicle[]> {
  try {
    const res = await fetch(`${API_BASE}/vehicles`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchParts(token: string): Promise<Part[]> {
  try {
    const res = await fetch(`${API_BASE}/parts`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AdminParts() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const [vehicles, parts] = await Promise.all([fetchVehicles(token), fetchParts(token)]);
  const partsByVehicle = vehicles
    .map((v) => ({
      vehicle: v,
      parts: parts.filter((p) => p.vehicleId === v.id),
    }))
    .filter((group) => group.parts.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parts by Vehicle</h1>
          <p className="text-sm text-muted-foreground">View parts within each vehicle</p>
        </div>
      </div>

      {partsByVehicle.length === 0 && (
        <Card className="border border-border bg-card">
          <CardContent className="p-4 text-sm text-muted-foreground">No parts found.</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partsByVehicle.map(({ vehicle, parts }) => (
          <Card key={vehicle.id} className="border border-border bg-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg text-foreground">{vehicle.plate}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Owner: <span className="text-foreground">{vehicle.customerName || "Unknown"}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {parts.map((part) => (
                <div key={part.id} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{part.name}</span>
                    <Badge variant="outline">{part.statusKey || "status"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Qty: {part.quantity ?? 1}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
