"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateCaseStatus } from "@/lib/api/vehicles";
import { useRouter } from "next/navigation";

export function CaseStatusToggle({
  caseId,
  status,
  token,
}: {
  caseId: string;
  status?: string | null;
  token: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isCompleted = status === "completed";

  const nextStatus = isCompleted ? "in_progress" : "completed";
  const label = isCompleted ? "Aktif Et" : "Tamamlandı";

  return (
    <Button
      variant={isCompleted ? "outline" : "secondary"}
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await updateCaseStatus(caseId, nextStatus, token);
          router.refresh();
        })
      }
    >
      {pending ? "Kaydediliyor..." : label}
    </Button>
  );
}
