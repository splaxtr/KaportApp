import { json, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

export const GET = withAuth(async () => {
  try {
    const roles = await prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return json(
      roles.map((r: { id: number; key: string; name: string; description: string | null }) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        description: r.description,
      })),
    );
  } catch (error) {
    logger.error("Roles fetch error", error as Error, { path: "/api/roles", method: "GET" });
    return serverError();
  }
}, { requiredPermissions: ["roles.manage"] });
