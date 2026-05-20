import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { RentChart } from "@/components/dashboard/RentChart"
import { StatusDonut } from "@/components/dashboard/StatusDonut"
import { UpcomingDues } from "@/components/dashboard/UpcomingDues"
import { Skeleton } from "@/components/ui/skeleton"
import { getRecordStatus } from "@/lib/utils"
import { Building2, Users, IndianRupee, AlertTriangle } from "lucide-react"
import type { RecordRow } from "@/types/database"

async function DashboardContent() {
  const supabase = await createClient()

  const { data: records } = await supabase
    .from("records")
    .select("*")
    .order("due_date", { ascending: true })

  const rows: RecordRow[] = records ?? []

  const totalProperties = rows.length
  const totalTenants = new Set(rows.map((r) => r.tenant_name)).size
  const totalRent = rows.reduce((s, r) => s + r.rent_amount, 0)
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

  // Build last-6-month rent collection data
  const now = new Date()
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
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          title="Monthly Rent"
          value={`₹${totalRent.toLocaleString("en-IN")}`}
          icon={<IndianRupee className="h-5 w-5" />}
          color="emerald"
        />
        <KpiCard
          title="Overdue"
          value={overdueCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
          href="/records?status=overdue"
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of your rental portfolio
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
