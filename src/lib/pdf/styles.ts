import { StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";

// Roboto font kaydı - Türkçe karakter desteği
Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"), fontWeight: 700 },
  ],
});

// Türkçe hecelemeyi devre dışı bırak
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  primary: "#2d5016",
  primaryLight: "#4a7c25",
  accent: "#84cc16",
  dark: "#1a1a1a",
  text: "#333333",
  muted: "#666666",
  light: "#999999",
  border: "#e0e0e0",
  bgLight: "#f8f9fa",
  bgAccent: "#f0fdf4",
  white: "#ffffff",
  noteYellow: "#fffde7",
  noteBorder: "#ffc107",
};

export const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontSize: 10, fontFamily: "Roboto" },

  // Header band
  headerBand: {
    backgroundColor: COLORS.primary,
    marginHorizontal: -40,
    marginTop: -40,
    paddingHorizontal: 40,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCompanyName: { fontSize: 18, fontWeight: 700, color: COLORS.white },
  headerDocType: { fontSize: 14, fontWeight: 700, color: COLORS.accent },

  // Company details under header
  companyBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  companyDetail: { fontSize: 8, color: COLORS.muted },

  // Meta info (customer / vehicle)
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 12 },
  metaBlock: {
    width: "48%",
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgLight,
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.primary,
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 2,
    marginTop: 4,
  },
  metaLabelFirst: {
    fontSize: 7,
    color: COLORS.primary,
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 2,
  },
  metaValue: { fontSize: 10, marginBottom: 2, color: COLORS.dark },

  // Section
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    color: COLORS.primary,
    textTransform: "uppercase",
  },

  // Table
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  headerText: { fontWeight: 700, fontSize: 8, color: COLORS.white, textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgLight,
  },
  col1: { width: "40%" },
  col2: { width: "15%", textAlign: "center" },
  col3: { width: "20%", textAlign: "right" },
  col4: { width: "25%", textAlign: "right" },

  // Summary box
  summaryBox: {
    marginTop: 20,
    alignSelf: "flex-end",
    width: "50%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  summaryLabel: { fontSize: 9, color: COLORS.muted },
  summaryValue: { fontSize: 9, fontWeight: 700, color: COLORS.text },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primary,
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 700, color: COLORS.white },
  grandTotalValue: { fontSize: 12, fontWeight: 700, color: COLORS.accent },

  // Notes
  noteBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: COLORS.noteYellow,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.noteBorder,
  },
  noteText: { fontSize: 9, color: COLORS.muted },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    textAlign: "center",
    fontSize: 7,
    color: COLORS.light,
  },

  // Totals row (legacy compat)
  totalRow: { flexDirection: "row", marginTop: 8, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: COLORS.text },
  totalLabel: { width: "75%", textAlign: "right", fontWeight: 700, fontSize: 11 },
  totalValue: { width: "25%", textAlign: "right", fontWeight: 700, fontSize: 11 },
  grandTotal: { fontSize: 14, fontWeight: 700, color: COLORS.dark },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  header: { marginBottom: 16 },
});

export function formatTRY(value: number): string {
  return (
    new Intl.NumberFormat("tr-TR", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) +
    " TL"
  );
}

export function formatDateTR(date: Date | string | null): string {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("tr-TR");
}
