"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartPoint {
  month: string
  collected: number
}

export function RentChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card className="rounded-xl h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Rent Collected (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="pr-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
              formatter={(v) =>
                [`₹${Number(v).toLocaleString("en-IN")}`, "Collected"]
              }
              contentStyle={{
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Area
              type="monotone"
              dataKey="collected"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#rentGradient)"
              dot={{ fill: "#6366f1", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
