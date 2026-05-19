"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = {
  Paid: "#22c55e",
  "Due Soon": "#f59e0b",
  Overdue: "#ef4444",
}

interface StatusDonutProps {
  paid: number
  dueSoon: number
  overdue: number
}

export function StatusDonut({ paid, dueSoon, overdue }: StatusDonutProps) {
  const data = [
    { name: "Paid", value: paid },
    { name: "Due Soon", value: dueSoon },
    { name: "Overdue", value: overdue },
  ].filter((d) => d.value > 0)

  const total = paid + dueSoon + overdue

  return (
    <Card className="rounded-xl h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Payment Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-8">No records yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [v, name]}
                contentStyle={{
                  borderRadius: "8px",
                  fontSize: "12px",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ fontSize: 12 }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
