import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { RecordsTable } from "@/components/table/RecordsTable"
import { SkeletonTable } from "@/components/shared/SkeletonTable"

async function RecordsContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: records }, { data: columns }] = await Promise.all([
    supabase.from("records").select("*").order("created_at", { ascending: false }),
    supabase.from("custom_columns").select("*").order("created_at"),
  ])

  return (
    <RecordsTable
      initialRecords={records ?? []}
      customColumns={columns ?? []}
      userId={user.id}
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
