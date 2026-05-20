import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { RentChart } from "@/components/dashboard/RentChart"
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

  const { data: records } = await supabase
    .from("records")
    .select("*")
    .order("due_date", { ascending: true })

  const rows: RecordRow[] = records ?? []

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const currentMonthLabel = now.toLocaleString("default", { month: "long", year: "numeric" })

  const totalProperties = rows.length
  const totalTenants = new Set(rows.map((r) => r.tenant_name)).size

  const monthRows = rows.filter((r) => r.due_date?.startsWith(currentMonthStr))
  const totalReceivable = monthRows.reduce((s, r) => s + r.rent_amount, 0)
  const totalCollected = monthRows
    .filter((r) => r.amount_paid)
    .reduce((s, r) => s + r.rent_amount, 0)
  const totalOutstanding = totalReceivable - totalCollected

  const overdueCount = rows.filter(
    (r) => getRecordStatus(r.due_date, r.amount_paid) === "overdue"
  ).length

  const paidCount = rows.filter(
    (r) => getRecordStatus(r.due_date, r.amount_paid) === "paid"
  ).length
  const dueSoonCount = rows.filter(
    (r) => getRecordStatus(r.due_date, r.amount_paid) === "due-soon"
  ).length

  const upcoming = rows
    .filter((r) => getRecordStatus(r.due_date, r.amount_paid) !== "paid")
    .slice(0, 5)

  // Last-6-month rent collection chart data
  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return d.toLocaleString("default", { month: "short", year: "2-digit" })
  })
  const chartData = monthLabels.map((label, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const collected = rows
      .filter((r) => r.amount_paid && r.due_date?.startsWith(monthStr))
      .reduce((s, r) => s + r.rent_amount, 0)
    return { month: label, collected }
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

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RentChart data={chartData} />
        </div>
        <StatusDonut
          paid={paidCount}
          dueSoon={dueSoonCount}
          overdue={overdueCount}
        />
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
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  // Auth check must be OUTSIDE the Suspense boundary to avoid redirect()
  // throwing inside a streaming context and reaching the error boundary.
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
