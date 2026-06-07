import type { RecordRow, RentPaymentRow } from "@/types/database"
import { formatCurrency, formatDueDay, getRecordStatus } from "./utils"

// ─── Month helpers (month is always "YYYY-MM") ────────────────────────────────
export function monthStrOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function currentMonthStr(): string {
  return monthStrOf(new Date())
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" })
}

export function shortMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "short", year: "2-digit" })
}

// last N months as YYYY-MM, oldest first, ending with the current month
export function lastNMonths(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  d.setDate(1)
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(monthStrOf(m))
  }
  return out
}

// ─── Proration ────────────────────────────────────────────────────────────────
// Full rent every month except the lease's first month, which is charged for the
// days actually lived in. Identical logic to the dashboard/admin computations.
export function getProratedAmount(rec: RecordRow, month: string): number {
  if (!rec.lease_start) return rec.rent_amount
  if (rec.lease_start.substring(0, 7) !== month) return rec.rent_amount
  const [y, m] = month.split("-").map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const startDay = parseInt(rec.lease_start.substring(8, 10))
  const daysActive = daysInMonth - startDay + 1
  if (daysActive >= daysInMonth) return rec.rent_amount
  return Math.round((daysActive / daysInMonth) * rec.rent_amount)
}

// Is this lease active in the given month? (started on or before that month)
export function isActiveInMonth(rec: RecordRow, month: string): boolean {
  if (!rec.lease_start) return true
  return rec.lease_start.substring(0, 7) <= month
}

// ─── Payment methods ──────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ["Cash", "UPI", "Bank transfer", "Cheque", "Other"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

// ─── WhatsApp reminder (wa.me click-to-send — no API, no cost) ─────────────────
// Builds a wa.me link with a pre-filled message. Sending stays manual: the link
// opens WhatsApp with the message ready; the landlord taps send.
export function buildWhatsAppReminder(
  rec: RecordRow,
  opts: { amountDue: number; month: string; overdue: boolean }
): string {
  const digits = rec.contact_number.replace(/\D/g, "")
  const phone = digits.length === 10 ? `91${digits}` : digits // assume +91 (India)
  const lines = [
    `Hi ${rec.tenant_name},`,
    "",
    opts.overdue
      ? `This is a gentle reminder that your rent for ${monthLabel(opts.month)} is overdue.`
      : `This is a friendly reminder that your rent for ${monthLabel(opts.month)} is due.`,
    "",
    `Property: ${rec.property_name}`,
    `Amount: ${formatCurrency(opts.amountDue)}`,
    `Due date: ${formatDueDay(rec.due_day)} of the month`,
    "",
    "Kindly arrange the payment at your earliest convenience. Thank you!",
  ]
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`
}

// ─── Status convenience ────────────────────────────────────────────────────────
// Excused (from the month's payment row) wins, else the records.amount_paid-based status.
export function effectiveStatus(rec: RecordRow, payment?: RentPaymentRow) {
  if (payment?.excused) return "excused" as const
  return getRecordStatus(rec.due_day, rec.amount_paid)
}
