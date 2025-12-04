import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { OverviewCards } from "./components/overview-cards";
import { SystemHealth } from "./components/system-health";
import { RecentActivities } from "./components/recent-activities";
import { TopShops } from "./components/top-shops";
import { PartDistribution } from "./components/part-distribution";
import { SectionTitle } from "./components/section-title";
import {
  getActivities,
  getGlobalMetrics,
  getPartDistribution,
  getSystemMetrics,
  getTopShops,
} from "@/lib/api/admin";

type Decoded = { role?: string };

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  if (decoded.role !== "admin") redirect("/not-authorized");

  const [globalMetrics, systemMetrics, activities, topShops, partDist] = await Promise.all([
    getGlobalMetrics(token),
    getSystemMetrics(token),
    getActivities(token),
    getTopShops(token),
    getPartDistribution(token),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Sistem genel bakış ve operasyonel metrikler</p>
        <h1 className="text-3xl font-bold text-foreground">Yönetici Paneli</h1>
      </div>

      <SectionTitle title="Genel Bakış" />
      <OverviewCards
        shops={globalMetrics.shops}
        users={globalMetrics.users}
        vehicles={globalMetrics.vehicles}
        partsPending={globalMetrics.partsPending}
        last24hActions={globalMetrics.last24hActions}
      />

      <SectionTitle title="Sistem Sağlığı" subtitle="API / DB / Depolama durumları" />
      <SystemHealth
        apiHealth={systemMetrics.apiHealth}
        dbLatency={systemMetrics.dbLatency}
        storage={systemMetrics.storage}
        uptime={systemMetrics.uptime}
      />

      <SectionTitle title="Son Aktiviteler" />
      <RecentActivities activities={activities} />

      <SectionTitle title="En Yoğun Şubeler" />
      <TopShops shops={topShops} />

      <SectionTitle title="Parça Durum Dağılımı" />
      <PartDistribution data={partDist} />
    </div>
  );
}
