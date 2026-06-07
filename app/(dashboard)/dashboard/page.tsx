import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { StatusDonut } from "@/components/dashboard/StatusDonut"
import { UpcomingDues } from "@/components/dashboard/UpcomingDues"
import { PrivacyProvider } from "@/components/dashboard/PrivacyProvider"
import { PrivacyToggle } from "@/components/dashboard/PrivacyToggle"
import { Skeleton } from "@/components/ui/skeleton"
import { getRecordStatus, formatCurrency } from "@/lib/utils"
import { Building2, Users, IndianRupee, AlertTriangle, Wallet, TrendingDown } from "lucide-react"
import type { RecordRow } from "@/types/database"

async function DashboardContent() {
  const supabase = await createClient()

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const currentMonthLabel = now.toLocaleString("default", { month: "long", year: "numeric" })

  const [{ data: records }, { data: rentPayments }] = await Promise.all([
    supabase.from("records").select("*").order("due_day", { ascending: true }),
    supabase.from("rent_payments").select("record_id, month, amount_due, paid, excused, notes"),
  ])

  const rows: RecordRow[] = records ?? []

  // Build payment map for current month
  type PaymentEntry = { record_id: string; amount_due: number; paid: boolean; excused: boolean; notes: string | null }
  const paymentMap: Record<string, PaymentEntry> = {}
  for (const p of (rentPayments ?? []).filter((p) => p.month === currentMonthStr)) {
    if (p.record_id) paymentMap[p.record_id] = p as PaymentEntry
  }

  function getProratedAmount(rec: RecordRow): number {
    if (!rec.lease_start) return rec.rent_amount
    const leaseStartMonth = rec.lease_start.substring(0, 7)
    if (currentMonthStr !== leaseStartMonth) return rec.rent_amount
    const [y, m] = currentMonthStr.split("-").map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const startDay = parseInt(rec.lease_start.substring(8, 10))
    const daysActive = daysInMonth - startDay + 1
    if (daysActive >= daysInMonth) return rec.rent_amount
    return Math.round((daysActive / daysInMonth) * rec.rent_amount)
  }

  type EffStatus = "paid" | "upcoming" | "due-soon" | "overdue" | "excused"
  function effectiveStatus(rec: RecordRow): EffStatus {
    const p = paymentMap[rec.id]
    if (p?.excused) return "excused"
    return getRecordStatus(rec.due_day, rec.amount_paid)
  }

  const totalProperties = rows.length
  const totalTenants = new Set(rows.map((r) => r.tenant_name)).size

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
    const amount = getProratedAmount(rec)
    totalReceivable += amount
    if (rec.amount_paid) totalCollected += amount
  }
  const totalOutstanding = totalReceivable - totalCollected

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

      {/* Status donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatusDonut
            paid={paidCount}
            upcoming={upcomingCount}
            dueSoon={dueSoonCount}
            overdue={overdueCount}
          />
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
