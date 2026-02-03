"use client";

import { Suspense, lazy } from "react";

const SwaggerUI = lazy(() => import("./swagger-ui"));

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="p-8 text-center">API Docs yükleniyor...</div>}>
        <SwaggerUI />
      </Suspense>
    </main>
  );
}
