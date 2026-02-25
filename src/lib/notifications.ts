import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type NotificationType = "file_created" | "status_changed" | "part_updated" | "appointment_reminder" | "system";

export async function createNotification({
  userId,
  type = "system",
  title,
  message,
  link,
}: {
  userId: number;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, link: link ?? null },
    });
  } catch (error) {
    logger.error("Failed to create notification", error as Error, { userId, type });
  }
}

export async function notifyAdmins({
  type = "system",
  title,
  message,
  link,
}: {
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { key: { in: ["system_admin", "admin"] } },
      },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: admins.map((admin: { id: number }) => ({
        userId: admin.id,
        type,
        title,
        message,
        link: link ?? null,
      })),
    });
  } catch (error) {
    logger.error("Failed to notify admins", error as Error, { type });
  }
}
