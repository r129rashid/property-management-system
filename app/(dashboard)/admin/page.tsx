import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminConsole } from "@/components/admin/AdminConsole"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: records } = await supabase
    .from("records")
    .select("*")
    .order("property_name", { ascending: true })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Admin Console</h2>
        <p className="text-sm text-muted-foreground">
          Excuse rent payments for specific months. Mark paid/unpaid from the Rental Ledger.
        </p>
      </div>
      <AdminConsole records={records ?? []} userId={user.id} />
    </div>
  )
}
