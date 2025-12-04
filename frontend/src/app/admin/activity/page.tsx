import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type Activity = {
  id: string;
  scope: string;
  refId: string;
  type: string;
  payload?: any;
  actorId: string;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
type Decoded = { role?: string };

async function fetchActivities(token: string): Promise<Activity[]> {
  const res = await fetch(`${API_BASE}/activities`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load activities");
  }
  return res.json();
}

export default async function AdminActivityPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  let activities: Activity[] = [];
  try {
    activities = await fetchActivities(token);
  } catch {
    activities = [];
  }

  return (
    <div className="space-y-4">
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Aktivite Günlüğü</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-3">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span>{a.payload?.message ?? a.type}</span>
                      <Badge variant="outline">{a.scope}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Ref: {a.refId} • Aktör: {a.actorId}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-sm text-muted-foreground">Aktivite bulunamadı.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
