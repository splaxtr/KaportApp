import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, formatTRY, formatDateTR } from "./styles";

interface QuoteData {
  fileNumber: string;
  date: string;
  customer: { fullName: string; email?: string | null; phone?: string | null };
  vehicle: { plate: string; brandModel: string; color: string };
  parts: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
  operations: { title: string; laborCost: number; materialCost: number; total: number }[];
  summary: { subtotal: number; discount: number; taxRate: number; taxAmount: number; grandTotal: number };
}

export function QuoteDocument({ data }: { data: QuoteData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>TEKLİF</Text>
          <Text style={styles.subtitle}>KaportaAPP</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Müşteri</Text>
            <Text style={styles.metaValue}>{data.customer.fullName}</Text>
            {data.customer.phone && <Text style={styles.metaValue}>{data.customer.phone}</Text>}
            {data.customer.email && <Text style={styles.metaValue}>{data.customer.email}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Araç</Text>
            <Text style={styles.metaValue}>{data.vehicle.plate}</Text>
            <Text style={styles.metaValue}>{data.vehicle.brandModel} - {data.vehicle.color}</Text>
            <Text style={styles.metaLabel}>Tarih</Text>
            <Text style={styles.metaValue}>{formatDateTR(data.date)}</Text>
            {data.fileNumber && <><Text style={styles.metaLabel}>Dosya No</Text><Text style={styles.metaValue}>{data.fileNumber}</Text></>}
          </View>
        </View>

        {data.parts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parçalar</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.headerText]}>Parça</Text>
              <Text style={[styles.col2, styles.headerText]}>Adet</Text>
              <Text style={[styles.col3, styles.headerText]}>Birim Fiyat</Text>
              <Text style={[styles.col4, styles.headerText]}>Toplam</Text>
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
            <Text style={styles.sectionTitle}>İşlemler</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.headerText]}>İşlem</Text>
              <Text style={[styles.col2, styles.headerText]}>İşçilik</Text>
              <Text style={[styles.col3, styles.headerText]}>Malzeme</Text>
              <Text style={[styles.col4, styles.headerText]}>Toplam</Text>
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
            <Text style={styles.summaryLabel}>Alt Toplam</Text>
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

        <Text style={styles.footer}>Bu teklif bilgilendirme amaçlıdır. KaportaAPP tarafından oluşturulmuştur.</Text>
      </Page>
    </Document>
  );
}
