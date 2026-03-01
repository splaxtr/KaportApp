"use client";

import { Suspense, lazy } from "react";

const SwaggerUI = lazy(() => import("./swagger-ui"));

export default function ApiDocsPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="min-h-screen bg-white p-8 text-center text-gray-500">
        API docs is disabled in production.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="p-8 text-center">API Docs yükleniyor...</div>}>
        <SwaggerUI />
      </Suspense>
    </main>
  );
}
