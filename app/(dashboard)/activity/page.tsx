import { ActivityLog } from "@/components/shared/ActivityLog"

export default function ActivityPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Activity Log</h2>
        <p className="text-sm text-muted-foreground">
          Recent actions in your account
        </p>
      </div>
      <ActivityLog />
    </div>
  )
}
