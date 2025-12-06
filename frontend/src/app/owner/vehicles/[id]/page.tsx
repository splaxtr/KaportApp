import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getVehicleScoped,
  getCaseParts,
  getCasePhotos,
  getCaseTasks,
  getVehicleTimeline,
} from "@/lib/api/vehicles";
import Image from "next/image";
import { Car, Package2, Image as ImageIcon, ListChecks, Building2, User } from "lucide-react";
import { PartsTab as AdminPartsTab } from "@/app/admin/vehicles/[id]/components/parts-tab";
import { TasksTab } from "@/app/admin/vehicles/[id]/components/tasks-tab";
import { PhotosTab as AdminPhotosTab } from "@/app/admin/vehicles/[id]/components/photos-tab";
import { CaseStatusToggle } from "../components/case-status-toggle";

type Decoded = { role?: string; shopId?: string };

export default async function OwnerVehicleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");
  const decoded = jwtDecode<Decoded>(token);
  const vehicle = await getVehicleScoped(id, token).catch(() => null);
  if (!vehicle) redirect("/owner/vehicles");
  const caseId = vehicle.cases?.[0]?.id;
  const caseStatus = vehicle.cases?.[0]?.status;
  const [parts, photos, tasks, activity] = await Promise.all([
    caseId ? getCaseParts(caseId, token) : Promise.resolve([]),
    caseId ? getCasePhotos(caseId, token) : Promise.resolve([]),
    caseId ? getCaseTasks(caseId, token) : Promise.resolve([]),
    getVehicleTimeline(id, token).catch(() => []),
  ]);

  return (
    <div className="space-y-4">
      {/* Üst başlık kartı */}
      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-foreground text-xl font-semibold">
              <Car className="h-5 w-5 text-muted-foreground" />
              {vehicle.plate}
              {vehicle.package && <Badge variant="secondary">{vehicle.package}</Badge>}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>
                {vehicle.brand || "-"} {vehicle.model || ""} {vehicle.year ? `(${vehicle.year})` : ""}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="flex items-center gap-1 text-xs">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {decoded.shopId || "-"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Sahip: {vehicle.currentOwner?.name || "-"} · Dosya: {vehicle.cases?.[0]?.caseNumber || "-"}
            </div>
          </div>
          <div className="text-sm text-muted-foreground flex flex-col sm:items-end">
            <span>Oluşturma: {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString("tr-TR") : "-"}</span>
            <span>Güncelleme: {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString("tr-TR") : "-"}</span>
            {caseId ? (
              <div className="mt-2 flex items-center gap-2">
                {caseStatus === "completed" ? <Badge variant="secondary">Tamamlandı</Badge> : null}
                <CaseStatusToggle caseId={caseId} status={caseStatus} token={token} />
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Özet</TabsTrigger>
          <TabsTrigger value="owners">Sahiplik Geçmişi</TabsTrigger>
          <TabsTrigger value="parts">Parçalar</TabsTrigger>
          <TabsTrigger value="tasks">İşlemler</TabsTrigger>
          <TabsTrigger value="photos">Fotoğraflar</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border border-border bg-card lg:col-span-2">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>Özet</CardTitle>
                <div className="text-sm text-muted-foreground">Plaka ve araç detayları</div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Field label="Plaka">{vehicle.plate}</Field>
                <Field label="Araç">
                  {vehicle.brand || "-"} {vehicle.model || ""} {vehicle.year ? `(${vehicle.year})` : ""}
                </Field>
                <Field label="Dosya No">{vehicle.cases?.[0]?.caseNumber || "-"}</Field>
                <Field label="Kaza Tarihi">
                  {vehicle.cases?.[0]?.damageDate
                    ? new Date(vehicle.cases[0].damageDate as string).toLocaleDateString("tr-TR")
                    : "-"}
                </Field>
                <Field label="Notlar" className="md:col-span-2">
                  {vehicle.notes || "-"}
                </Field>
                <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                  <Metric icon={<Package2 className="h-4 w-4" />} label="Parça" value={parts.length} />
                  <Metric icon={<ImageIcon className="h-4 w-4" />} label="Fotoğraf" value={photos.length} />
                  <Metric icon={<ListChecks className="h-4 w-4" />} label="İşlem" value={tasks.length} />
                </div>
                <Separator className="md:col-span-2 opacity-40" />
                <div className="text-xs text-muted-foreground md:col-span-2">
                  Oluşturma: {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString("tr-TR") : "-"} · Güncelleme:{" "}
                  {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString("tr-TR") : "-"}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Sahiplik</CardTitle>
                <div className="text-sm text-muted-foreground">Güncel sahip ve iletişim</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Field label="Sahip" icon={<User className="h-4 w-4 text-muted-foreground" />}>
                  {vehicle.currentOwner?.name || "-"}
                </Field>
                <Field label="E-posta">{vehicle.currentOwner?.email || "-"}</Field>
                <Field label="Telefon">{vehicle.currentOwner?.phone || "-"}</Field>
              </CardContent>
            </Card>
          </div>
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Sahiplik Geçmişi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">Henüz sahiplik geçmişi bulunmuyor.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts">
          <AdminPartsTab parts={parts} token={token} caseId={caseId} shopId={vehicle.shop?.id || decoded.shopId} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab caseId={caseId} token={token} initialTasks={tasks} />
        </TabsContent>

        <TabsContent value="photos">
          <AdminPhotosTab photos={photos} token={token} vehicle={vehicle} caseId={caseId} shopId={vehicle.shop?.id || decoded.shopId} />
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>Aktivite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activity.length === 0 && <div className="text-sm text-muted-foreground">Aktivite yok.</div>}
              {activity.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{a.message || a.type || "Aktivite"}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString("tr-TR") : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  children,
  className,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-border/60 bg-muted/20 p-3 ${className || ""}`}>
      <div className="flex items-center gap-1 text-xs uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
