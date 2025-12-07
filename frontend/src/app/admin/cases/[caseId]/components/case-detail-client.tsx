"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseDetailResponse, getCaseDetail } from "@/lib/api/admin/cases";
import { OverviewTab } from "./overview-tab";
import { PartsTab } from "./parts-tab";
import { PhotosTab } from "./photos-tab";
import { OperationsTab } from "./operations-tab";
import { TimelineTab } from "./timeline-tab";
import { Card } from "@/components/ui/card";
import { ChangeStatusDialog } from "./change-status-dialog";

type Props = {
  initialData: CaseDetailResponse;
  caseId: string;
  token: string;
};

export function CaseDetailClient({ initialData, caseId, token }: Props) {
  const [data, setData] = useState<CaseDetailResponse>(initialData);
  const [statusOpen, setStatusOpen] = useState(false);

  const refresh = useCallback(async () => {
    const fresh = await getCaseDetail(caseId, token);
    setData(fresh);
  }, [caseId, token]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Araç</p>
            <p className="text-lg font-semibold">
              {data.vehicle.plate} · {data.vehicle.brand ?? "-"} {data.vehicle.model ?? ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ChangeStatusDialog
              open={statusOpen}
              onOpenChange={setStatusOpen}
              caseId={caseId}
              currentStatus={data.case.status}
              token={token}
              onSuccess={async () => {
                await refresh();
              }}
            />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Özet</TabsTrigger>
          <TabsTrigger value="parts">Parçalar</TabsTrigger>
          <TabsTrigger value="photos">Fotoğraflar</TabsTrigger>
          <TabsTrigger value="operations">İşlemler</TabsTrigger>
          <TabsTrigger value="timeline">Aktivite</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab data={data} onChangeStatus={() => setStatusOpen(true)} />
        </TabsContent>

        <TabsContent value="parts" className="mt-4">
          <PartsTab
            caseId={caseId}
            parts={data.parts}
            token={token}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <PhotosTab
            caseId={caseId}
            photos={data.photos}
            token={token}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="operations" className="mt-4">
          <OperationsTab
            caseId={caseId}
            operations={data.operations}
            token={token}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab
            caseId={caseId}
            initialTimeline={data.timeline}
            token={token}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
