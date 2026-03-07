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
        {/* Header Band */}
        <View style={styles.headerBand}>
          <Text style={styles.headerCompanyName}>{companyName}</Text>
          <Text style={styles.headerDocType}>FATURA</Text>
        </View>

        {/* Company Details Bar */}
        <View style={styles.companyBar}>
          <Text style={styles.companyDetail}>
            {[data.company.address, data.company.phone ? `Tel: ${data.company.phone}` : null].filter(Boolean).join(" | ")}
          </Text>
          {data.company.taxId ? (
            <Text style={styles.companyDetail}>
              Vergi No: {data.company.taxId}{data.company.taxOffice ? ` / ${data.company.taxOffice}` : ""}
            </Text>
          ) : null}
        </View>

        {/* Customer & Vehicle Info */}
        <View style={styles.meta}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabelFirst}>Müşteri Bilgileri</Text>
            <Text style={styles.metaValue}>{data.customer.fullName}</Text>
            {data.customer.tcVkn && (
              <>
                <Text style={styles.metaLabel}>TC/VKN</Text>
                <Text style={styles.metaValue}>{data.customer.tcVkn}</Text>
              </>
            )}
            {data.customer.phone && <Text style={styles.metaValue}>{data.customer.phone}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabelFirst}>Araç Bilgileri</Text>
            <Text style={styles.metaValue}>{data.vehicle.plate} - {data.vehicle.brandModel}</Text>
            <Text style={styles.metaLabel}>Fatura Tarihi</Text>
            <Text style={styles.metaValue}>{formatDateTR(data.date)}</Text>
            {data.fileNumber && (
              <>
                <Text style={styles.metaLabel}>Dosya No</Text>
                <Text style={styles.metaValue}>{data.fileNumber}</Text>
              </>
            )}
          </View>
        </View>

        {/* Parts Table */}
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
              <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                <Text style={styles.col1}>{p.name}</Text>
                <Text style={styles.col2}>{p.quantity}</Text>
                <Text style={styles.col3}>{formatTRY(p.unitPrice)}</Text>
                <Text style={styles.col4}>{formatTRY(p.totalPrice)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Operations Table */}
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
              <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                <Text style={styles.col1}>{op.title}</Text>
                <Text style={styles.col2}>{formatTRY(op.laborCost)}</Text>
                <Text style={styles.col3}>{formatTRY(op.materialCost)}</Text>
                <Text style={styles.col4}>{formatTRY(op.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary Box */}
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
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>GENEL TOPLAM</Text>
            <Text style={styles.grandTotalValue}>{formatTRY(data.summary.grandTotal)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Bu fatura {companyName !== "Firma Adı Belirtilmemiş" ? `${companyName} tarafından ` : ""}düzenlenmiştir.
        </Text>
      </Page>
    </Document>
  );
}
