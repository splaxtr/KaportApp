"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function ReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="İnceleme sayfası hatası" />;
}
