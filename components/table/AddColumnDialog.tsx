"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { createClient } from "@/lib/supabase/client"
import { customColumnSchema, type CustomColumnFormData } from "@/lib/validations/record"
import type { CustomColumnRow } from "@/types/database"

interface AddColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onColumnAdded: (col: CustomColumnRow) => void
  onColumnDeleted: (id: string) => void
  existingColumns: CustomColumnRow[]
}

export function AddColumnDialog({
  open,
  onOpenChange,
  userId,
  onColumnAdded,
  onColumnDeleted,
  existingColumns,
}: AddColumnDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CustomColumnRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomColumnFormData>({
    resolver: zodResolver(customColumnSchema),
    defaultValues: { data_type: "text" },
  })

  const dataType = watch("data_type")

  const onSubmit = async (data: CustomColumnFormData) => {
    setLoading(true)
    const { data: col, error } = await supabase
      .from("custom_columns")
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    onColumnAdded(col)
    toast.success(`Column "${data.name}" added`)
    reset({ data_type: "text" })
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const { error } = await supabase
      .from("custom_columns")
      .delete()
      .eq("id", deleteTarget.id)
    if (error) {
      toast.error(error.message)
      setDeleteLoading(false)
      return
    }
    onColumnDeleted(deleteTarget.id)
    toast.success(`Column "${deleteTarget.name}" removed`)
    setDeleteTarget(null)
    setDeleteLoading(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage Custom Columns</DialogTitle>
          </DialogHeader>

          {/* Existing columns */}
          {existingColumns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Existing
              </p>
              {existingColumns.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">{col.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{col.data_type}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(col)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Separator />
            </div>
          )}

          {/* Add new column */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Add new column
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="col-name">Column Name</Label>
              <Input
                id="col-name"
                {...register("name")}
                placeholder="e.g. Floor Number"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Data Type</Label>
              <Select
                value={dataType}
                onValueChange={(v) =>
                  setValue("data_type", v as CustomColumnFormData["data_type"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="numeric">Numeric</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes / No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Column
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title={`Delete column "${deleteTarget?.name}"?`}
        description="Existing data in this column will no longer be visible. This cannot be undone."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  )
}
