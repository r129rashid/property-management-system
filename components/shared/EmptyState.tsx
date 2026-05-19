import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title?: string
  description?: string
  onAdd?: () => void
  addLabel?: string
}

export function EmptyState({
  title = "No records yet",
  description = "Add your first property and tenant to get started.",
  onAdd,
  addLabel = "Add first record",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-2xl bg-muted mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">{description}</p>
      {onAdd && (
        <Button onClick={onAdd} className="bg-indigo-500 hover:bg-indigo-600 text-white">
          {addLabel}
        </Button>
      )}
    </div>
  )
}
