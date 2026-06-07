import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { RecordsTable } from "@/components/table/RecordsTable"
import { SkeletonTable } from "@/components/shared/SkeletonTable"
import { ensureCurrentMonthRows } from "@/lib/payments-server"
import type { RentPaymentRow } from "@/types/database"

async function RecordsContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [{ data: records }, { data: columns }, { data: payments }] = await Promise.all([
    supabase.from("records").select("*").order("created_at", { ascending: false }),
    supabase.from("custom_columns").select("*").order("created_at"),
    supabase.from("rent_payments").select("*").eq("month", currentMonthStr),
  ])

  const recs = records ?? []
  const existing = new Set((payments ?? []).map((p) => p.record_id))
  const inserted = await ensureCurrentMonthRows(supabase, recs, existing, user.id)

  const paymentMap: Record<string, RentPaymentRow> = {}
  for (const p of [...(payments ?? []), ...inserted]) paymentMap[p.record_id] = p

  return (
    <RecordsTable
      initialRecords={recs}
      customColumns={columns ?? []}
      userId={user.id}
      currentMonthPayments={paymentMap}
    />
  )
}

export default function RecordsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Rental Ledger</h2>
        <p className="text-sm text-muted-foreground">
          Manage your rental properties and tenants
        </p>
      </div>
      <Suspense fallback={<SkeletonTable />}>
        <RecordsContent />
      </Suspense>
    </div>
  )
}
