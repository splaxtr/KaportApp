import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 10 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  metaBlock: { width: "48%" },
  metaLabel: { fontSize: 8, color: "#999", textTransform: "uppercase", marginBottom: 2 },
  metaValue: { fontSize: 10, marginBottom: 6 },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd", paddingVertical: 4 },
  col1: { width: "40%" },
  col2: { width: "15%", textAlign: "center" },
  col3: { width: "20%", textAlign: "right" },
  col4: { width: "25%", textAlign: "right" },
  headerText: { fontWeight: "bold", fontSize: 9, color: "#333" },
  totalRow: { flexDirection: "row", marginTop: 8, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: "#333" },
  totalLabel: { width: "75%", textAlign: "right", fontWeight: "bold", fontSize: 11 },
  totalValue: { width: "25%", textAlign: "right", fontWeight: "bold", fontSize: 11 },
  summaryBox: { marginTop: 20, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { fontSize: 10, color: "#555" },
  summaryValue: { fontSize: 10, fontWeight: "bold" },
  grandTotal: { fontSize: 14, fontWeight: "bold", color: "#000" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
  section: { marginTop: 15 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 6, color: "#333" },
  noteBox: { marginTop: 20, padding: 10, backgroundColor: "#fffde7", borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#ffc107" },
  noteText: { fontSize: 9, color: "#555" },
});

export function formatTRY(value: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

export function formatDateTR(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("tr-TR");
}
