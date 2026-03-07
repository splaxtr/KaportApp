import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, formatTRY, formatDateTR } from "./styles";

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  taxOffice: string;
}

interface InvoiceData {
  fileNumber: string;
  date: string;
  company: CompanyInfo;
  customer: { fullName: string; email?: string | null; phone?: string | null; tcVkn?: string | null };
  vehicle: { plate: string; brandModel: string; color: string };
  parts: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
  operations: { title: string; laborCost: number; materialCost: number; total: number }[];
  summary: { subtotal: number; discount: number; taxRate: number; taxAmount: number; grandTotal: number };
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const companyName = data.company.name || "Firma Adı Belirtilmemiş";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FATURA</Text>
          <Text style={styles.subtitle}>{companyName}</Text>
          {data.company.address ? <Text style={styles.companyDetail}>{data.company.address}</Text> : null}
          {data.company.phone ? <Text style={styles.companyDetail}>Tel: {data.company.phone}</Text> : null}
          {data.company.taxId ? (
            <Text style={styles.companyDetail}>
              Vergi No: {data.company.taxId}{data.company.taxOffice ? ` / ${data.company.taxOffice}` : ""}
            </Text>
          ) : null}
        </View>

        <View style={styles.meta}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Müşteri Bilgileri</Text>
            <Text style={styles.metaValue}>{data.customer.fullName}</Text>
            {data.customer.tcVkn && <><Text style={styles.metaLabel}>TC/VKN</Text><Text style={styles.metaValue}>{data.customer.tcVkn}</Text></>}
            {data.customer.phone && <Text style={styles.metaValue}>{data.customer.phone}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Araç Bilgileri</Text>
            <Text style={styles.metaValue}>{data.vehicle.plate} - {data.vehicle.brandModel}</Text>
            <Text style={styles.metaLabel}>Fatura Tarihi</Text>
            <Text style={styles.metaValue}>{formatDateTR(data.date)}</Text>
            {data.fileNumber && <><Text style={styles.metaLabel}>Dosya No</Text><Text style={styles.metaValue}>{data.fileNumber}</Text></>}
          </View>
        </View>

        {data.parts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parçalar</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.headerText]}>Parça Adı</Text>
              <Text style={[styles.col2, styles.headerText]}>Adet</Text>
              <Text style={[styles.col3, styles.headerText]}>Birim Fiyat</Text>
              <Text style={[styles.col4, styles.headerText]}>Tutar</Text>
            </View>
            {data.parts.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{p.name}</Text>
                <Text style={styles.col2}>{p.quantity}</Text>
                <Text style={styles.col3}>{formatTRY(p.unitPrice)}</Text>
                <Text style={styles.col4}>{formatTRY(p.totalPrice)}</Text>
              </View>
            ))}
          </View>
        )}

        {data.operations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İşçilik</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.headerText]}>İşlem Adı</Text>
              <Text style={[styles.col2, styles.headerText]}>İşçilik</Text>
              <Text style={[styles.col3, styles.headerText]}>Malzeme</Text>
              <Text style={[styles.col4, styles.headerText]}>Tutar</Text>
            </View>
            {data.operations.map((op, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{op.title}</Text>
                <Text style={styles.col2}>{formatTRY(op.laborCost)}</Text>
                <Text style={styles.col3}>{formatTRY(op.materialCost)}</Text>
                <Text style={styles.col4}>{formatTRY(op.total)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ara Toplam</Text>
            <Text style={styles.summaryValue}>{formatTRY(data.summary.subtotal)}</Text>
          </View>
          {data.summary.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>İndirim</Text>
              <Text style={styles.summaryValue}>-{formatTRY(data.summary.discount)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>KDV (%{data.summary.taxRate})</Text>
            <Text style={styles.summaryValue}>{formatTRY(data.summary.taxAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: "#ccc", marginTop: 4, paddingTop: 6 }]}>
            <Text style={styles.grandTotal}>GENEL TOPLAM</Text>
            <Text style={styles.grandTotal}>{formatTRY(data.summary.grandTotal)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Bu fatura {companyName !== "Firma Adı Belirtilmemiş" ? `${companyName} tarafından` : ""} düzenlenmiştir.
        </Text>
      </Page>
    </Document>
  );
}
