import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency, formatDueDay, getRecordStatus } from "@/lib/utils"
import type { RecordRow } from "@/types/database"

const STATUS_CLS = {
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "due-soon": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
} as const

export function UpcomingDues({ records }: { records: RecordRow[] }) {
  if (records.length === 0) return null

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Upcoming / Overdue</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {records.map((r) => {
            const status = getRecordStatus(r.due_day, r.amount_paid)
            return (
              <Link
                key={r.id}
                href={`/records/${r.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium leading-tight">{r.property_name}</p>
                  <p className="text-xs text-muted-foreground">{r.tenant_name}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    Due {formatDueDay(r.due_day)}
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(r.rent_amount)}</span>
                  <Badge className={cn("text-xs border-0 capitalize", STATUS_CLS[status])}>
                    {status === "due-soon" ? "Due Soon" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
