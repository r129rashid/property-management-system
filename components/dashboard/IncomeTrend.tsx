"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { usePrivacy } from "./PrivacyProvider"

interface TrendPoint {
  month: string
  receivable: number
  collected: number
}

export function IncomeTrend({ data }: { data: TrendPoint[] }) {
  const { hidden } = usePrivacy()
  const hasData = data.some((d) => d.receivable > 0 || d.collected > 0)

  return (
    <Card className="rounded-xl h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Receivable vs Collected — last 6 months
        </CardTitle>
      </CardHeader>
      <CardContent className="pr-2">
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No data yet — record some payments to see the trend.
          </p>
        ) : (
          <div className={cn(hidden && "blur-sm pointer-events-none select-none")}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="recvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground"
                  width={48}
                />
                <Tooltip
                  formatter={(v, name) => [`₹${Number(v).toLocaleString("en-IN")}`, name]}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                <Area
                  type="monotone"
                  name="Receivable"
                  dataKey="receivable"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#recvGradient)"
                  dot={{ fill: "#6366f1", r: 2 }}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  name="Collected"
                  dataKey="collected"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#collGradient)"
                  dot={{ fill: "#22c55e", r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
