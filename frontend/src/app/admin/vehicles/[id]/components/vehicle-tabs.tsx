"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleRow } from "@/lib/api/vehicles";
import { PartRow } from "@/lib/api/parts";
import { PhotoRow } from "@/lib/api/photos";
import { VehicleOverview } from "./vehicle-overview";
import { PartsTab } from "./parts-tab";
import { PhotosTab } from "./photos-tab";
import { ActivityTab } from "./activity-tab";
import { OwnerHistoryTab } from "./owner-history-tab";
import { TasksTab } from "./tasks-tab";
import { VehicleTaskRow } from "@/lib/api/vehicles";

type ActivityItem = { id: string; message?: string; payload?: any; createdAt: string };

export function VehicleTabs({
  vehicle,
  caseId,
  shopId,
  parts,
  photos,
  activity,
  token,
  tasks,
}: {
  vehicle: VehicleRow;
  caseId?: string | null;
  shopId?: string;
  parts: PartRow[];
  photos: PhotoRow[];
  activity: ActivityItem[];
  tasks: VehicleTaskRow[];
  token: string;
}) {
  return (
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
        <VehicleOverview vehicle={vehicle} token={token} />
      </TabsContent>
      <TabsContent value="owners">
        <OwnerHistoryTab vehicle={vehicle} />
      </TabsContent>
      <TabsContent value="parts">
        <PartsTab parts={parts} token={token} caseId={caseId} shopId={shopId} />
      </TabsContent>
      <TabsContent value="tasks">
        <TasksTab caseId={caseId} token={token} initialTasks={tasks} />
      </TabsContent>
      <TabsContent value="photos">
        <PhotosTab photos={photos} token={token} vehicle={vehicle} caseId={caseId} shopId={shopId} />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityTab activity={activity} />
      </TabsContent>
    </Tabs>
  );
}
