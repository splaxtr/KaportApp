import { NextRequest } from "next/server";

import { AuthUser } from "@/lib/auth";

export function getAuditContext(
  req: NextRequest,
  user: AuthUser,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  return {
    userId: user.id,
    role: user.role,
    method: req.method,
    path: req.nextUrl.pathname,
    ip,
    userAgent,
    ...extra,
  };
}
