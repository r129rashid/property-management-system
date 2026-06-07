import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { StatusDonut } from "@/components/dashboard/StatusDonut"
import { IncomeTrend } from "@/components/dashboard/IncomeTrend"
import { UpcomingDues } from "@/components/dashboard/UpcomingDues"
import { PrivacyProvider } from "@/components/dashboard/PrivacyProvider"
import { PrivacyToggle } from "@/components/dashboard/PrivacyToggle"
import { Skeleton } from "@/components/ui/skeleton"
import { getRecordStatus, formatCurrency } from "@/lib/utils"
import {
  getProratedAmount,
  isActiveInMonth,
  lastNMonths,
  shortMonthLabel,
} from "@/lib/payments"
import { ensureCurrentMonthRows } from "@/lib/payments-server"
import { Building2, Users, IndianRupee, AlertTriangle, Wallet, TrendingDown } from "lucide-react"
import type { RecordRow, RentPaymentRow } from "@/types/database"

async function DashboardContent() {
  const supabase = await createClient()

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const currentMonthLabel = now.toLocaleString("default", { month: "long", year: "numeric" })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: records }, { data: rentPayments }] = await Promise.all([
    supabase.from("records").select("*").order("due_day", { ascending: true }),
    supabase.from("rent_payments").select("*"),
  ])

  const rows: RecordRow[] = records ?? []

  // Auto-generate this month's ledger rows for active leases (idempotent).
  const existingThisMonth = new Set(
    (rentPayments ?? []).filter((p) => p.month === currentMonthStr).map((p) => p.record_id)
  )
  const inserted = user
    ? await ensureCurrentMonthRows(supabase, rows, existingThisMonth, user.id)
    : []
  const allPayments: RentPaymentRow[] = [...(rentPayments ?? []), ...inserted]

  // Build payment map for current month
  const paymentMap: Record<string, RentPaymentRow> = {}
  for (const p of allPayments.filter((p) => p.month === currentMonthStr)) {
    if (p.record_id) paymentMap[p.record_id] = p
  }

  type EffStatus = "paid" | "upcoming" | "due-soon" | "overdue" | "excused"
  function effectiveStatus(rec: RecordRow): EffStatus {
    const p = paymentMap[rec.id]
    if (p?.excused) return "excused"
    return getRecordStatus(rec.due_day, rec.amount_paid)
  }

  const totalProperties = rows.length
  // One tenant per record — matches the Admin console's count.
  const totalTenants = rows.length

  const overdueCount = rows.filter((r) => effectiveStatus(r) === "overdue").length
  const paidCount = rows.filter((r) => effectiveStatus(r) === "paid").length
  const dueSoonCount = rows.filter((r) => effectiveStatus(r) === "due-soon").length
  const upcomingCount = rows.filter((r) => effectiveStatus(r) === "upcoming").length

  const upcoming = rows
    .filter((r) => effectiveStatus(r) !== "paid" && effectiveStatus(r) !== "excused")
    .slice(0, 5)

  // Financial KPIs — excused entries excluded; paid = records.amount_paid
  let totalReceivable = 0
  let totalCollected = 0
  for (const rec of rows) {
    const payment = paymentMap[rec.id]
    if (payment?.excused) continue // waived this month
    const amount = getProratedAmount(rec, currentMonthStr)
    totalReceivable += amount
    if (rec.amount_paid) totalCollected += amount
  }
  const totalOutstanding = totalReceivable - totalCollected

  // 6-month trend — receivable is analytic (from records), collected from the ledger.
  const paymentByKey = new Map<string, RentPaymentRow>()
  for (const p of allPayments) paymentByKey.set(`${p.record_id}|${p.month}`, p)
  const trend = lastNMonths(6).map((m) => {
    let receivable = 0
    let collected = 0
    for (const rec of rows) {
      if (!isActiveInMonth(rec, m)) continue
      if (paymentByKey.get(`${rec.id}|${m}`)?.excused) continue
      receivable += getProratedAmount(rec, m)
    }
    for (const p of allPayments) {
      if (p.month === m && p.paid) collected += p.paid_amount ?? 0
    }
    return { month: shortMonthLabel(m), receivable, collected }
  })

  return (
    <div className="space-y-6">
      {/* KPI row 1 — portfolio counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          title="Total Properties"
          value={totalProperties}
          icon={<Building2 className="h-5 w-5" />}
          color="indigo"
        />
        <KpiCard
          title="Total Tenants"
          value={totalTenants}
          icon={<Users className="h-5 w-5" />}
          color="violet"
        />
        <KpiCard
          title="Overdue"
          value={overdueCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
          href="/records?status=overdue"
        />
      </div>

      {/* KPI row 2 — current-month financials */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          title="Receivable"
          value={formatCurrency(totalReceivable)}
          icon={<IndianRupee className="h-5 w-5" />}
          color="indigo"
          subtitle={currentMonthLabel}
        />
        <KpiCard
          title="Collected"
          value={formatCurrency(totalCollected)}
          icon={<Wallet className="h-5 w-5" />}
          color="emerald"
          subtitle={currentMonthLabel}
        />
        <KpiCard
          title="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="amber"
          subtitle={currentMonthLabel}
        />
      </div>

      {/* Status donut + income trend */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatusDonut
            paid={paidCount}
            upcoming={upcomingCount}
            dueSoon={dueSoonCount}
            overdue={overdueCount}
          />
        </div>
        <div className="lg:col-span-2">
          <IncomeTrend data={trend} />
        </div>
      </div>

      {/* Upcoming dues */}
      <UpcomingDues records={upcoming} />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl lg:max-w-sm" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = new Date()
  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <PrivacyProvider>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <PrivacyToggle />
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </PrivacyProvider>
  )
}
