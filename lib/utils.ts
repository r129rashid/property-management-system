import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isBefore, addDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function maskAadhar(aadhar: string): string {
  if (aadhar.length !== 12) return aadhar
  return `XXXX-XXXX-${aadhar.slice(8)}`
}

export type RecordStatus = "paid" | "due-soon" | "overdue"

export function getRecordStatus(dueDate: string, amountPaid: boolean): RecordStatus {
  if (amountPaid) return "paid"
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (isBefore(due, today)) return "overdue"
  if (isBefore(due, addDays(today, 6))) return "due-soon"
  return "due-soon"
}

export function formatDate(date: string): string {
  return format(new Date(date), "dd MMM yyyy")
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `RCP-${year}-${rand}`
}
