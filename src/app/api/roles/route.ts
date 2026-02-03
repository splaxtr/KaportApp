import { json, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";

export const GET = withAuth(async () => {
  try {
    const roles = await prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return json(
      roles.map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        description: r.description,
      })),
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}, { requiredPermissions: ["roles.manage"] });
