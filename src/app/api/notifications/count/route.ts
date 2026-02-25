import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { serverError } from "@/lib/http";
import { logger } from "@/lib/logger";

// GET: Okunmamış bildirim sayısı
export const GET = withAuth(async (_req, { user }) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return NextResponse.json({ count });
  } catch (error) {
    logger.error("Notification count error", error as Error, { path: "/api/notifications/count", method: "GET" });
    return serverError();
  }
});
