import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { json, handleApiError } from "@/lib/http";
import { withAuth } from "@/lib/api-guard";
import { logger } from "@/lib/logger";

async function getOrCreate() {
  let row = await prisma.companySetting.findFirst();
  if (!row) {
    row = await prisma.companySetting.create({ data: {} });
  }
  return row;
}

export const GET = withAuth(async () => {
  try {
    const c = await getOrCreate();
    return json({
      name: c.name,
      address: c.address,
      phone: c.phone,
      email: c.email,
      taxId: c.taxId,
      taxOffice: c.taxOffice,
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/settings/company", method: "GET" });
  }
}, { requiredPermissions: ["roles.manage"] });

export const PATCH = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const data: Record<string, string> = {};

    for (const key of ["name", "address", "phone", "email", "taxId", "taxOffice"] as const) {
      if (typeof body?.[key] === "string") {
        data[key] = body[key].trim();
      }
    }

    const c = await getOrCreate();
    const updated = await prisma.companySetting.update({
      where: { id: c.id },
      data,
    });

    return json({
      name: updated.name,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      taxId: updated.taxId,
      taxOffice: updated.taxOffice,
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/settings/company", method: "PATCH" });
  }
}, { requiredPermissions: ["roles.manage"] });
