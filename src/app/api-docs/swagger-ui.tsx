"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "@/lib/openapi";

export default function SwaggerUIComponent() {
  return (
    <div className="swagger-container">
      <SwaggerUI spec={openApiSpec} />
      <style jsx global>{`
        .swagger-container {
          padding: 20px;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info .title {
          font-size: 2rem;
        }
        .swagger-ui .scheme-container {
          background: #f7f7f7;
          padding: 15px;
        }
      `}</style>
    </div>
  );
}
