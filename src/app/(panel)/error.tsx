"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Sayfa yüklenirken hata oluştu" />;
}
