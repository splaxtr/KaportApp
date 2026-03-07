import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-guard";
import { notFound, handleApiError } from "@/lib/http";
import { logger } from "@/lib/logger";
import { QuoteDocument } from "@/lib/pdf/quote";
import { InvoiceDocument } from "@/lib/pdf/invoice";
import { AssessmentDocument } from "@/lib/pdf/assessment";

export const GET = withAuth(async (req: NextRequest, { params }) => {
  try {
    const { id } = await params as { id: string };
    const fileId = Number(id);
    if (!fileId || fileId <= 0) return notFound();

    const type = req.nextUrl.searchParams.get("type") || "quote";
    if (!["quote", "invoice", "assessment"].includes(type)) {
      return NextResponse.json({ error: "Geçersiz tip. quote|invoice|assessment" }, { status: 400 });
    }

    const vehicleFile = await prisma.vehicleFile.findFirst({
      where: { id: fileId, deletedAt: null },
      include: {
        vehicle: true,
        customer: { include: { phones: { where: { deletedAt: null }, take: 1 } } },
        expert: true,
        parts: { where: { deletedAt: null }, include: { status: true } },
        operations: { where: { deletedAt: null }, include: { status: true } },
      },
    });

    if (!vehicleFile) return notFound();

    let companySetting = await prisma.companySetting.findFirst();
    if (!companySetting) {
      companySetting = await prisma.companySetting.create({ data: {} });
    }
    const company = {
      name: companySetting.name || "",
      address: companySetting.address || "",
      phone: companySetting.phone || "",
      email: companySetting.email || "",
      taxId: companySetting.taxId || "",
      taxOffice: companySetting.taxOffice || "",
    };

    const partsData = vehicleFile.parts.map((p: typeof vehicleFile.parts[number]) => ({
      name: p.name,
      quantity: p.quantity,
      unitPrice: p.unitPrice ? Number(p.unitPrice) : 0,
      totalPrice: p.totalPrice ? Number(p.totalPrice) : (p.unitPrice ? Number(p.unitPrice) * p.quantity : 0),
      status: p.status?.label ?? "—",
    }));

    const opsData = vehicleFile.operations.map((op: typeof vehicleFile.operations[number]) => ({
      title: op.title,
      description: op.description,
      laborCost: op.laborCost ? Number(op.laborCost) : 0,
      materialCost: op.materialCost ? Number(op.materialCost) : 0,
      total: (op.laborCost ? Number(op.laborCost) : 0) + (op.materialCost ? Number(op.materialCost) : 0),
      status: op.status?.label ?? "—",
    }));

    const partsTotal = partsData.reduce((s: number, p: { totalPrice: number }) => s + p.totalPrice, 0);
    const opsTotal = opsData.reduce((s: number, op: { total: number }) => s + op.total, 0);
    const subtotal = partsTotal + opsTotal;
    const discount = vehicleFile.discount ? Number(vehicleFile.discount) : 0;
    const taxRate = vehicleFile.taxRate ? Number(vehicleFile.taxRate) : 20;
    const afterDiscount = subtotal - discount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const grandTotal = afterDiscount + taxAmount;

    const summary = { subtotal, discount, taxRate, taxAmount, grandTotal };

    const commonData = {
      fileNumber: vehicleFile.fileNumber || `D-${vehicleFile.id}`,
      date: new Date().toISOString(),
      company,
      customer: {
        fullName: vehicleFile.customer.fullName,
        email: vehicleFile.customer.email,
        phone: vehicleFile.customer.phones[0]?.phone || null,
        tcVkn: vehicleFile.customer.tcVkn,
      },
      vehicle: {
        plate: vehicleFile.vehicle.plate,
        brandModel: vehicleFile.brandModel,
        color: vehicleFile.color,
      },
    };

    let doc: React.ReactElement;
    let filename: string;

    if (type === "quote") {
      doc = React.createElement(QuoteDocument, { data: { ...commonData, parts: partsData, operations: opsData, summary } });
      filename = `teklif-${vehicleFile.vehicle.plate}-${vehicleFile.id}.pdf`;
    } else if (type === "invoice") {
      doc = React.createElement(InvoiceDocument, { data: { ...commonData, parts: partsData, operations: opsData, summary } });
      filename = `fatura-${vehicleFile.vehicle.plate}-${vehicleFile.id}.pdf`;
    } else {
      doc = React.createElement(AssessmentDocument, {
        data: {
          ...commonData,
          accidentDate: vehicleFile.accidentDate?.toISOString() || null,
          expert: vehicleFile.expert,
          parts: partsData,
          operations: opsData,
          quickNote: vehicleFile.quickNote,
        },
      });
      filename = `hasar-raporu-${vehicleFile.vehicle.plate}-${vehicleFile.id}.pdf`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error, logger.error.bind(logger), { path: "/api/vehicle-files/[id]/pdf", method: "GET" });
  }
}, { requiredPermissions: ["vehicleFiles.manage"] });
