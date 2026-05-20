import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency, formatDate, formatDueDay, generateReceiptNumber, maskAadhar } from "./utils"
import type { RecordRow } from "@/types/database"

export function generatePDF(record: RecordRow): void {
  const doc = new jsPDF()
  const receiptNo = generateReceiptNumber()
  const today = formatDate(new Date().toISOString().split("T")[0])

  // Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("RENT RECEIPT", 105, 24, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text(`Receipt No: ${receiptNo}`, 14, 36)
  doc.text(`Date: ${today}`, 196, 36, { align: "right" })

  // Divider
  doc.setDrawColor(99, 102, 241)
  doc.setLineWidth(0.5)
  doc.line(14, 40, 196, 40)

  // Details table
  autoTable(doc, {
    startY: 46,
    head: [],
    body: [
      ["Property Name", record.property_name],
      ["Tenant Name", record.tenant_name],
      ["Contact", record.contact_number],
      ["Aadhar", maskAadhar(record.aadhar_number)],
      ["Location", record.property_location],
      ["Rent Due Day", `${formatDueDay(record.due_day)} of every month`],
      ["Payment Status", "PAID ✓"],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, fillColor: [248, 248, 255] as [number, number, number] },
      1: { cellWidth: 130 },
    },
    styles: { fontSize: 10, cellPadding: 5 },
    theme: "grid",
  })

  // Amount banner
  const finalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFillColor(99, 102, 241)
  doc.roundedRect(14, finalY, 182, 22, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text(
    `Amount Received: ${formatCurrency(record.rent_amount)}`,
    105,
    finalY + 14,
    { align: "center" }
  )

  // Footer
  doc.setTextColor(160, 160, 160)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("This is a computer-generated receipt.", 105, 285, { align: "center" })

  doc.save(`receipt-${record.tenant_name.replace(/\s+/g, "-")}-${receiptNo}.pdf`)
}
