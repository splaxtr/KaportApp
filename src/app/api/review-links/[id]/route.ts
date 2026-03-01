import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";
import { getAuditContext } from "@/lib/audit";

type Params = { id: string };

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const PATCH = withAuth<Params>(async (req: NextRequest, { params, user }) => {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return badRequest("Geçersiz id");

    const token = await prisma.reviewToken.findFirst({ where: { id, deletedAt: null } });
    if (!token) return notFound();

    const body = await req.json().catch(() => ({}));
    const action = body?.action as "revoke" | "restore" | "delete";
    if (!action) return badRequest("action gerekli");

    if (action === "revoke") {
      await prisma.reviewToken.update({ where: { id }, data: { revokedAt: new Date() } });
      logger.audit("revoke", "review_link", getAuditContext(req, user, { targetId: id }));
    } else if (action === "restore") {
      await prisma.reviewToken.update({ where: { id }, data: { revokedAt: null } });
      logger.audit("restore", "review_link", getAuditContext(req, user, { targetId: id }));
    } else if (action === "delete") {
      await prisma.reviewToken.update({ where: { id }, data: { deletedAt: new Date() } });
      logger.audit("delete", "review_link", getAuditContext(req, user, { targetId: id }));
    }

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/review-links/[id]", method: "PATCH" });
  }
}, { requiredPermissions: ["reviews.manage"] });
