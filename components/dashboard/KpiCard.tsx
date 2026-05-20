"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const COLOR_MAP = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
} as const

interface KpiCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: keyof typeof COLOR_MAP
}

export function KpiCard({ title, value, icon, color }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="rounded-xl">
        <CardContent className="p-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn("p-2.5 rounded-lg shrink-0", COLOR_MAP[color])}>
            {icon}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
