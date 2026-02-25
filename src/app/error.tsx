"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="bg-slate-950 text-white antialiased">
        <ErrorFallback error={error} reset={reset} title="Uygulama hatası" />
      </body>
    </html>
  );
}
