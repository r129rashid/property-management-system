"use client"

import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { recordSchema, type RecordFormData } from "@/lib/validations/record"
import type { RecordRow, CustomColumnRow } from "@/types/database"

interface RecordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: RecordFormData & { custom_fields: Record<string, unknown> }
  ) => Promise<void>
  defaultValues?: Partial<RecordRow>
  customColumns: CustomColumnRow[]
  loading?: boolean
  mode: "create" | "edit"
}

export function RecordForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  customColumns,
  loading,
  mode,
}: RecordFormProps) {
  const customRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({})

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: { amount_paid: false },
  })

  useEffect(() => {
    if (open) {
      reset({
        property_name: defaultValues?.property_name ?? "",
        tenant_name: defaultValues?.tenant_name ?? "",
        contact_number: defaultValues?.contact_number ?? "",
        aadhar_number: defaultValues?.aadhar_number ?? "",
        property_location: defaultValues?.property_location ?? "",
        rent_amount: defaultValues?.rent_amount ?? (undefined as unknown as number),
        lease_start: defaultValues?.lease_start ?? "",
        due_day: defaultValues?.due_day ?? (undefined as unknown as number),
        amount_paid: defaultValues?.amount_paid ?? false,
      })
    }
  }, [open, defaultValues, reset])

  const amountPaid = watch("amount_paid")

  const handleFormSubmit = async (data: RecordFormData) => {
    const customFields: Record<string, unknown> = {}
    customColumns.forEach((col) => {
      const el = customRefs.current[col.id]
      if (!el) return
      const rawVal = (el as HTMLInputElement).type === "checkbox"
        ? (el as HTMLInputElement).checked
        : el.value
      if (rawVal !== "" && rawVal !== undefined) {
        customFields[col.id] =
          col.data_type === "numeric" && typeof rawVal === "string"
            ? Number(rawVal)
            : rawVal
      }
    })
    await onSubmit({ ...data, custom_fields: customFields })
  }

  const defaultCustomVal = (col: CustomColumnRow): string =>
    String(
      (defaultValues?.custom_fields as Record<string, unknown> | null)?.[col.id] ?? ""
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Record" : "Edit Record"}</DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="property_name">Property Name</Label>
              <Input
                id="property_name"
                placeholder="Sunrise Apartments"
                {...register("property_name")}
              />
              {errors.property_name && (
                <p className="text-xs text-destructive">{errors.property_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenant_name">Tenant Name</Label>
              <Input
                id="tenant_name"
                placeholder="Rahul Sharma"
                {...register("tenant_name")}
              />
              {errors.tenant_name && (
                <p className="text-xs text-destructive">{errors.tenant_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_number">Contact (10 digits)</Label>
              <Input
                id="contact_number"
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
                {...register("contact_number")}
              />
              {errors.contact_number && (
                <p className="text-xs text-destructive">{errors.contact_number.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aadhar_number">Aadhar (12 digits)</Label>
              <Input
                id="aadhar_number"
                placeholder="123456789012"
                maxLength={12}
                inputMode="numeric"
                {...register("aadhar_number")}
              />
              {errors.aadhar_number && (
                <p className="text-xs text-destructive">{errors.aadhar_number.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="property_location">Property Location</Label>
            <Textarea
              id="property_location"
              placeholder="123 MG Road, Bengaluru, Karnataka 560001"
              rows={2}
              {...register("property_location")}
            />
            {errors.property_location && (
              <p className="text-xs text-destructive">{errors.property_location.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lease_start">Lease Start Date</Label>
            <Input id="lease_start" type="date" {...register("lease_start")} />
            {errors.lease_start && (
              <p className="text-xs text-destructive">{errors.lease_start.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rent_amount">Rent Amount (₹)</Label>
              <Input
                id="rent_amount"
                type="number"
                placeholder="12500"
                inputMode="numeric"
                {...register("rent_amount", { valueAsNumber: true })}
              />
              {errors.rent_amount && (
                <p className="text-xs text-destructive">{errors.rent_amount.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_day">Due Day of Month</Label>
              <Input
                id="due_day"
                type="number"
                min={1}
                max={28}
                placeholder="e.g. 5"
                inputMode="numeric"
                {...register("due_day", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">1–28 (day rent is due each month)</p>
              {errors.due_day && (
                <p className="text-xs text-destructive">{errors.due_day.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="amount_paid"
              checked={amountPaid}
              onCheckedChange={(v) => setValue("amount_paid", !!v)}
            />
            <Label htmlFor="amount_paid" className="cursor-pointer font-normal">
              Mark as paid
            </Label>
          </div>

          {/* Custom columns */}
          {customColumns.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custom Fields
              </p>
              {customColumns.map((col) => (
                <div key={col.id} className="space-y-1.5">
                  <Label htmlFor={`cf_${col.id}`}>{col.name}</Label>
                  {col.data_type === "boolean" ? (
                    <div className="flex items-center gap-2">
                      <input
                        id={`cf_${col.id}`}
                        type="checkbox"
                        defaultChecked={defaultCustomVal(col) === "true"}
                        ref={(el) => {
                          if (el) customRefs.current[col.id] = el
                        }}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor={`cf_${col.id}`} className="font-normal">Yes</Label>
                    </div>
                  ) : (
                    <Input
                      id={`cf_${col.id}`}
                      type={
                        col.data_type === "numeric"
                          ? "number"
                          : col.data_type === "date"
                          ? "date"
                          : "text"
                      }
                      defaultValue={defaultCustomVal(col)}
                      ref={(el) => {
                        if (el) customRefs.current[col.id] = el
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Add Record" : "Save Changes"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
