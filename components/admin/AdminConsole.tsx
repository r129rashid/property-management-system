"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { CalendarDays, ChevronLeft, ChevronRight, Ban, RotateCcw } from "lucide-react"
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
import { createClient } from "@/lib/supabase/client"
import { cn, formatCurrency, getRecordStatus } from "@/lib/utils"
import type { RecordRow, RentPaymentRow } from "@/types/database"

interface Props {
  records: RecordRow[]
  userId: string
}

// Excused entries keyed by record_id (for current month only)
type ExcuseMap = Record<string, RentPaymentRow>

function getMonthStr(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}
function getMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" })
}

// Same status logic used in Records table and Dashboard
type UnifiedStatus = "paid" | "upcoming" | "due-soon" | "overdue" | "excused"

const STATUS_CONFIG: Record<UnifiedStatus, { label: string; cls: string }> = {
  paid: {
    label: "Paid",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  upcoming: {
    label: "Upcoming",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  "due-soon": {
    label: "Due Soon",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  overdue: {
    label: "Overdue",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  excused: {
    label: "Excused",
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
}

function unifiedStatus(rec: RecordRow, excused: boolean): UnifiedStatus {
  if (excused) return "excused"
  return getRecordStatus(rec.due_day, rec.amount_paid)
}

function computeProrated(rec: RecordRow, monthStr: string): number {
  if (!rec.lease_start) return rec.rent_amount
  if (rec.lease_start.substring(0, 7) !== monthStr) return rec.rent_amount
  const [y, m] = monthStr.split("-").map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const startDay = parseInt(rec.lease_start.substring(8, 10))
  const daysActive = daysInMonth - startDay + 1
  if (daysActive >= daysInMonth) return rec.rent_amount
  return Math.round((daysActive / daysInMonth) * rec.rent_amount)
}

export function AdminConsole({ records, userId }: Props) {
  const supabase = createClient()
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [excuseMap, setExcuseMap] = useState<ExcuseMap>({})
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const monthStr = getMonthStr(year, month)
  const monthLabel = getMonthLabel(year, month)

  const fetchExcused = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("rent_payments")
      .select("*")
      .eq("month", monthStr)
      .eq("excused", true)
    const map: ExcuseMap = {}
    for (const p of data ?? []) map[p.record_id] = p
    setExcuseMap(map)
    setLoading(false)
  }, [monthStr, supabase])

  useEffect(() => { fetchExcused() }, [fetchExcused])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const handleExcuse = async (rec: RecordRow) => {
    setActionLoading(rec.id)
    const amount = computeProrated(rec, monthStr)
    // Upsert: create entry if needed, set excused=true
    const { error } = await supabase.from("rent_payments").upsert(
      { record_id: rec.id, user_id: userId, month: monthStr, amount_due: amount, excused: true },
      { onConflict: "record_id,month" }
    )
    if (error) { toast.error(error.message); setActionLoading(null); return }
    await fetchExcused()
    toast.success(`${rec.tenant_name} excused for ${monthLabel}`)
    setActionLoading(null)
  }

  const handleUnexcuse = async (rec: RecordRow) => {
    const entry = excuseMap[rec.id]
    if (!entry) return
    setActionLoading(rec.id)
    const { error } = await supabase
      .from("rent_payments")
      .update({ excused: false })
      .eq("id", entry.id)
    if (error) { toast.error(error.message); setActionLoading(null); return }
    setExcuseMap(prev => {
      const next = { ...prev }
      delete next[rec.id]
      return next
    })
    toast.success(`Excuse removed for ${rec.tenant_name}`)
    setActionLoading(null)
  }

  const excusedCount = Object.keys(excuseMap).length
  const overdueCount = records.filter(
    r => unifiedStatus(r, !!excuseMap[r.id]) === "overdue"
  ).length

  return (
    <div className="space-y-6">
      {/* Month picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{monthLabel}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Tenants", value: records.length, color: "text-foreground" },
          { label: "Excused", value: excusedCount, color: "text-violet-600 dark:text-violet-400" },
          { label: "Overdue", value: overdueCount, color: "text-red-600 dark:text-red-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="rounded-xl">
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenant table */}
      <Card className="rounded-xl border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Payment Status — {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tenants yet. Add records first.
            </div>
          ) : (
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs">Tenant</TableHead>
                  <TableHead className="text-xs">Property</TableHead>
                  <TableHead className="text-xs">Rent</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => {
                  const isExcused = !!excuseMap[rec.id]
                  const status = unifiedStatus(rec, isExcused)
                  const cfg = STATUS_CONFIG[status]
                  const isLoading = actionLoading === rec.id
                  return (
                    <TableRow key={rec.id} className="border-b border-border/30">
                      <TableCell className="text-sm font-medium py-3">
                        {rec.tenant_name}
                      </TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">
                        {rec.property_name}
                      </TableCell>
                      <TableCell className="text-sm py-3 font-semibold">
                        {formatCurrency(rec.rent_amount)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn("border-0 text-xs", cfg.cls)}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {isExcused ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 gap-1"
                            disabled={isLoading}
                            onClick={() => handleUnexcuse(rec)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Un-excuse
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            disabled={isLoading || status === "paid"}
                            onClick={() => handleExcuse(rec)}
                          >
                            <Ban className="h-3 w-3" />
                            Excuse
                          </Button>
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
