"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  MoreVertical,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { cn, formatCurrency, formatDate, formatDueDay } from "@/lib/utils"
import type { RecordRow, RentPaymentRow } from "@/types/database"

interface Props {
  records: RecordRow[]
  userId: string
}

type PaymentMap = Record<string, RentPaymentRow>

function getMonthStr(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

function getMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" })
}

function computeAmountDue(rec: RecordRow, monthStr: string): {
  amount: number
  prorated: boolean
  note: string
} {
  const fullRent = { amount: rec.rent_amount, prorated: false, note: "" }
  if (!rec.lease_start) return fullRent

  const leaseStartMonth = rec.lease_start.substring(0, 7)
  if (monthStr !== leaseStartMonth) return fullRent

  const [y, m] = monthStr.split("-").map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const startDay = parseInt(rec.lease_start.substring(8, 10))
  const daysActive = daysInMonth - startDay + 1

  if (daysActive >= daysInMonth) return fullRent

  const amount = Math.round((daysActive / daysInMonth) * rec.rent_amount)
  return { amount, prorated: true, note: `${daysActive}/${daysInMonth} days` }
}

export function AdminConsole({ records, userId }: Props) {
  const supabase = createClient()
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [payments, setPayments] = useState<PaymentMap>({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const monthStr = getMonthStr(year, month)
  const monthLabel = getMonthLabel(year, month)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("rent_payments")
      .select("*")
      .eq("month", monthStr)
    const map: PaymentMap = {}
    for (const p of data ?? []) map[p.record_id] = p
    setPayments(map)
    setLoading(false)
  }, [monthStr, supabase])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const handleGenerateMonth = async () => {
    const eligible = records.filter((r) => {
      if (payments[r.id]) return false
      if (r.lease_start && r.lease_start.substring(0, 7) > monthStr) return false
      return true
    })
    if (!eligible.length) { toast.info("All eligible tenants already have entries for this month"); return }
    setActionLoading("generate")
    const rows = eligible.map((r) => {
      const { amount } = computeAmountDue(r, monthStr)
      return { record_id: r.id, user_id: userId, month: monthStr, amount_due: amount }
    })
    const { error } = await supabase.from("rent_payments").insert(rows)
    if (error) { toast.error(error.message); setActionLoading(null); return }
    toast.success(`Generated ${eligible.length} entr${eligible.length === 1 ? "y" : "ies"} for ${monthLabel}`)
    setActionLoading(null)
    fetchPayments()
  }

  const handleMarkPaid = async (paymentId: string, recordId: string) => {
    setActionLoading(paymentId)
    const today = new Date().toISOString().split("T")[0]
    const { error } = await supabase
      .from("rent_payments")
      .update({ paid: true, paid_on: today })
      .eq("id", paymentId)
    if (error) { toast.error(error.message); setActionLoading(null); return }
    setPayments((prev) => ({
      ...prev,
      [recordId]: { ...prev[recordId], paid: true, paid_on: today },
    }))
    toast.success("Marked as paid")
    setActionLoading(null)
  }

  const handleMarkUnpaid = async (paymentId: string, recordId: string) => {
    setActionLoading(paymentId)
    const { error } = await supabase
      .from("rent_payments")
      .update({ paid: false, paid_on: null })
      .eq("id", paymentId)
    if (error) { toast.error(error.message); setActionLoading(null); return }
    setPayments((prev) => ({
      ...prev,
      [recordId]: { ...prev[recordId], paid: false, paid_on: null },
    }))
    toast.success("Marked as unpaid")
    setActionLoading(null)
  }

  const handleExcuse = async (paymentId: string, recordId: string) => {
    setActionLoading(paymentId)
    const { error } = await supabase
      .from("rent_payments")
      .update({ excused: true })
      .eq("id", paymentId)
    if (error) { toast.error(error.message); setActionLoading(null); return }
    setPayments((prev) => ({
      ...prev,
      [recordId]: { ...prev[recordId], excused: true },
    }))
    toast.success("Month excused")
    setActionLoading(null)
  }

  const handleUnexcuse = async (paymentId: string, recordId: string) => {
    setActionLoading(paymentId)
    const { error } = await supabase
      .from("rent_payments")
      .update({ excused: false })
      .eq("id", paymentId)
    if (error) { toast.error(error.message); setActionLoading(null); return }
    setPayments((prev) => ({
      ...prev,
      [recordId]: { ...prev[recordId], excused: false },
    }))
    toast.success("Excuse removed")
    setActionLoading(null)
  }

  const handleCarryForward = async (payment: RentPaymentRow, record: RecordRow) => {
    setActionLoading(payment.id)
    const [py, pm] = payment.month.split("-").map(Number)
    const nextDate = new Date(py, pm, 1)
    const nextMonthStr = getMonthStr(nextDate.getFullYear(), nextDate.getMonth())
    const carryAmount = payment.amount_due + record.rent_amount

    const { error } = await supabase.from("rent_payments").upsert({
      record_id: record.id,
      user_id: userId,
      month: nextMonthStr,
      amount_due: carryAmount,
      carried_from: payment.id,
    }, { onConflict: "record_id,month" })

    if (error) { toast.error(error.message); setActionLoading(null); return }

    // Mark current payment as carried so UI reflects it everywhere
    await supabase.from("rent_payments")
      .update({ notes: "carried" })
      .eq("id", payment.id)

    setPayments((prev) => ({
      ...prev,
      [record.id]: { ...prev[record.id], notes: "carried" },
    }))
    toast.success(`₹${carryAmount.toLocaleString("en-IN")} carried to ${getMonthLabel(nextDate.getFullYear(), nextDate.getMonth())}`)
    setActionLoading(null)
  }

  const handleUndoCarry = async (payment: RentPaymentRow, recordId: string) => {
    setActionLoading(payment.id)
    // Delete the next month's entry that was created by this carry
    const { error: delError } = await supabase
      .from("rent_payments")
      .delete()
      .eq("carried_from", payment.id)
    if (delError) { toast.error(delError.message); setActionLoading(null); return }
    // Clear notes on current payment
    const { error } = await supabase
      .from("rent_payments")
      .update({ notes: null })
      .eq("id", payment.id)
    if (error) { toast.error(error.message); setActionLoading(null); return }
    setPayments((prev) => ({
      ...prev,
      [recordId]: { ...prev[recordId], notes: null },
    }))
    toast.success("Carry forward undone")
    setActionLoading(null)
  }

  const generated = records.filter((r) => payments[r.id])
  const unpaidCount = generated.filter(
    (r) => !payments[r.id]?.paid && !payments[r.id]?.excused && payments[r.id]?.notes !== "carried"
  ).length

  return (
    <div className="space-y-6">
      {/* Month picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{monthLabel}</h3>
          {unpaidCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs">
              {unpaidCount} unpaid
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-8 bg-indigo-500 hover:bg-indigo-600 text-white gap-1"
            onClick={handleGenerateMonth}
            disabled={actionLoading === "generate" || loading}
          >
            <Plus className="h-3.5 w-3.5" />
            Generate month
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Generated", value: generated.length, color: "text-foreground" },
          { label: "Collected", value: generated.filter(r => payments[r.id]?.paid).length, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Unpaid", value: unpaidCount, color: "text-amber-600 dark:text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="rounded-xl">
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenant table — horizontally scrollable to prevent action overflow */}
      <Card className="rounded-xl border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tenant Payment Status — {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No tenants yet. Add records first.</div>
          ) : (
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs">Tenant</TableHead>
                  <TableHead className="text-xs">Property</TableHead>
                  <TableHead className="text-xs">Lease Start</TableHead>
                  <TableHead className="text-xs">Due Day</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => {
                  const p = payments[rec.id]
                  const isLoading = actionLoading === (p?.id ?? rec.id)
                  const leaseNotStarted = rec.lease_start
                    ? rec.lease_start.substring(0, 7) > monthStr
                    : false
                  const { prorated, note } = computeAmountDue(rec, monthStr)

                  // Determine status badge
                  let statusBadge: React.ReactNode
                  if (leaseNotStarted) {
                    statusBadge = (
                      <Badge className="bg-muted text-muted-foreground border-0 text-xs">
                        Not started yet
                      </Badge>
                    )
                  } else if (!p) {
                    statusBadge = (
                      <Badge className="bg-muted text-muted-foreground border-0 text-xs">
                        Not generated
                      </Badge>
                    )
                  } else if (p.excused) {
                    statusBadge = (
                      <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0 text-xs">
                        Excused
                      </Badge>
                    )
                  } else if (p.notes === "carried") {
                    statusBadge = (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-xs">
                        Carried Fwd
                      </Badge>
                    )
                  } else if (p.paid) {
                    statusBadge = (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
                        Paid{p.paid_on ? ` · ${p.paid_on}` : ""}
                      </Badge>
                    )
                  } else {
                    statusBadge = (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs">
                        Unpaid
                      </Badge>
                    )
                  }

                  return (
                    <TableRow key={rec.id} className="border-b border-border/30">
                      <TableCell className="text-sm font-medium py-3">{rec.tenant_name}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">{rec.property_name}</TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">
                        {rec.lease_start
                          ? formatDate(rec.lease_start)
                          : <span className="text-amber-500">Not set</span>}
                      </TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">
                        {formatDueDay(rec.due_day)}
                      </TableCell>
                      <TableCell className="text-sm py-3 font-semibold">
                        {p
                          ? formatCurrency(p.amount_due)
                          : formatCurrency(prorated ? computeAmountDue(rec, monthStr).amount : rec.rent_amount)}
                        {p?.carried_from && (
                          <span className="ml-1 text-xs text-amber-500">(+carried)</span>
                        )}
                        {!p && prorated && (
                          <span className="ml-1 text-xs text-violet-500">({note})</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">{statusBadge}</TableCell>
                      <TableCell className="py-3 text-right">
                        {leaseNotStarted || !p ? (
                          <span className="text-xs text-muted-foreground">
                            {!p ? "Generate first" : ""}
                          </span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-8 px-0"
                                disabled={isLoading}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {p.excused ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnexcuse(p.id, rec.id)}
                                  className="text-violet-600 focus:text-violet-600 dark:text-violet-400 dark:focus:text-violet-400"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                  Remove excuse
                                </DropdownMenuItem>
                              ) : p.notes === "carried" ? (
                                <DropdownMenuItem
                                  onClick={() => handleUndoCarry(p, rec.id)}
                                  className="text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400"
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-2" />
                                  Undo carry forward
                                </DropdownMenuItem>
                              ) : p.paid ? (
                                <DropdownMenuItem onClick={() => handleMarkUnpaid(p.id, rec.id)}>
                                  <XCircle className="h-3.5 w-3.5 mr-2" />
                                  Mark as unpaid
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                                    onClick={() => handleMarkPaid(p.id, rec.id)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                    Mark as paid
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleExcuse(p.id, rec.id)}
                                  >
                                    <Ban className="h-3.5 w-3.5 mr-2" />
                                    Excuse this month
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCarryForward(p, rec)}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                    Carry forward
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
