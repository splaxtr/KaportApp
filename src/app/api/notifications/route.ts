import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { serverError } from "@/lib/http";
import { logger } from "@/lib/logger";

// GET: Kullanıcının bildirimlerini listele
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    logger.error("Notifications fetch error", error as Error, { path: "/api/notifications", method: "GET" });
    return serverError();
  }
});

// PATCH: Bildirimleri okundu olarak işaretle
export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const ids = body.ids as number[] | undefined;

    if (ids && Array.isArray(ids)) {
      // Belirli bildirimleri okundu yap
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else {
      // Tümünü okundu yap
      await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Notifications update error", error as Error, { path: "/api/notifications", method: "PATCH" });
    return serverError();
  }
});
