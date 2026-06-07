import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DocumentUpload } from "@/components/shared/DocumentUpload"
import { cn, formatCurrency, maskAadhar, getRecordStatus, formatDueDay, formatDate } from "@/lib/utils"

const STATUS_CONFIG = {
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
} as const

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: record } = await supabase
    .from("records")
    .select("*")
    .eq("id", id)
    .single()
  if (!record) notFound()

  const { data: columns } = await supabase.from("custom_columns").select("*")
  const status = getRecordStatus(record.due_day, record.amount_paid)
  const cfg = STATUS_CONFIG[status]

  const coreFields: [string, string][] = [
    ["Tenant", record.tenant_name],
    ["Contact", record.contact_number],
    ["Aadhar", maskAadhar(record.aadhar_number)],
    ["Lease Start", record.lease_start ? formatDate(record.lease_start) : "—"],
    ["Rent Amount", formatCurrency(record.rent_amount)],
    ["Due Day", `${formatDueDay(record.due_day)} of every month`],
    ["Paid", record.amount_paid ? "Yes" : "No"],
    ["Location", record.property_location],
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/records"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Records
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">{record.property_name}</CardTitle>
          <Badge className={cn("text-xs border-0", cfg.cls)}>{cfg.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {coreFields.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
            {columns?.map((col) => {
              const val = (record.custom_fields as Record<string, unknown>)?.[col.id]
              return (
                <div key={col.id}>
                  <p className="text-xs text-muted-foreground mb-0.5">{col.name}</p>
                  <p className="font-medium">
                    {val !== undefined && val !== null ? String(val) : "—"}
                  </p>
                </div>
              )
            })}
          </div>

          <Separator />

          <DocumentUpload recordId={record.id} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
