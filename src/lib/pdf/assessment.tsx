import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, formatDateTR } from "./styles";

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  taxOffice: string;
}

interface AssessmentData {
  fileNumber: string;
  date: string;
  accidentDate: string | null;
  company: CompanyInfo;
  customer: { fullName: string };
  vehicle: { plate: string; brandModel: string; color: string };
  expert?: { fullName: string; company?: string | null } | null;
  parts: { name: string; quantity: number; status: string }[];
  operations: { title: string; description?: string | null; status: string }[];
  quickNote?: string | null;
}

export function AssessmentDocument({ data }: { data: AssessmentData }) {
  const companyName = data.company.name || "Firma Adı Belirtilmemiş";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>HASAR TESPİT RAPORU</Text>
          <Text style={styles.subtitle}>{companyName}</Text>
          {data.company.address ? <Text style={styles.companyDetail}>{data.company.address}</Text> : null}
          {data.company.phone ? <Text style={styles.companyDetail}>Tel: {data.company.phone}</Text> : null}
        </View>

        <View style={styles.meta}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Araç Sahibi</Text>
            <Text style={styles.metaValue}>{data.customer.fullName}</Text>
            <Text style={styles.metaLabel}>Araç Bilgileri</Text>
            <Text style={styles.metaValue}>{data.vehicle.plate}</Text>
            <Text style={styles.metaValue}>{data.vehicle.brandModel} - {data.vehicle.color}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Rapor Tarihi</Text>
            <Text style={styles.metaValue}>{formatDateTR(data.date)}</Text>
            {data.accidentDate && <><Text style={styles.metaLabel}>Hasar Tarihi</Text><Text style={styles.metaValue}>{formatDateTR(data.accidentDate)}</Text></>}
            {data.fileNumber && <><Text style={styles.metaLabel}>Dosya No</Text><Text style={styles.metaValue}>{data.fileNumber}</Text></>}
            {data.expert && <><Text style={styles.metaLabel}>Eksper</Text><Text style={styles.metaValue}>{data.expert.fullName}{data.expert.company ? ` (${data.expert.company})` : ""}</Text></>}
          </View>
        </View>

        {data.parts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hasarlı Parçalar</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.headerText]}>Parça Adı</Text>
              <Text style={[styles.col2, styles.headerText]}>Adet</Text>
              <Text style={[styles.col4, styles.headerText]}>Durumu</Text>
            </View>
            {data.parts.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{p.name}</Text>
                <Text style={styles.col2}>{p.quantity}</Text>
                <Text style={styles.col4}>{p.status}</Text>
              </View>
            ))}
          </View>
        )}

        {data.operations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yapılacak İşlemler</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.headerText]}>İşlem Adı</Text>
              <Text style={[styles.col3, styles.headerText]}>Açıklama</Text>
              <Text style={[styles.col4, styles.headerText]}>Durumu</Text>
            </View>
            {data.operations.map((op, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{op.title}</Text>
                <Text style={styles.col3}>{op.description || "—"}</Text>
                <Text style={styles.col4}>{op.status}</Text>
              </View>
            ))}
          </View>
        )}

        {data.quickNote && (
          <View style={styles.noteBox}>
            <Text style={styles.metaLabel}>Notlar</Text>
            <Text style={styles.noteText}>{data.quickNote}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Bu hasar tespit raporu {companyName !== "Firma Adı Belirtilmemiş" ? `${companyName} tarafından` : ""} düzenlenmiştir.
        </Text>
      </Page>
    </Document>
  );
}
