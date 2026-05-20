"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface ActivityEntry {
  message?: string
  timestamp?: string
  // legacy field names (pre-fix stored data)
  action?: string
  ts?: string
}

const STORAGE_KEY = "pms_activity_log"

export function ActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw) as ActivityEntry[])
    } catch {
      // ignore
    }
  }, [])

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Recent Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e, i) => {
              const text = e.message ?? e.action ?? ""
              const tsRaw = e.timestamp ?? e.ts ?? ""
              const date = tsRaw ? new Date(tsRaw) : null
              const dateStr =
                date && !isNaN(date.getTime())
                  ? date.toLocaleString()
                  : "Unknown time"
              return (
                <li key={i} className="flex items-start justify-between gap-4 text-sm">
                  <span>{text}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {dateStr}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
