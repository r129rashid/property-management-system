import { z } from "zod"

export const recordSchema = z.object({
  property_name: z.string().min(1, "Required").max(100, "Max 100 characters"),
  tenant_name: z.string().min(1, "Required"),
  contact_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Must be exactly 10 digits — no spaces or country code"),
  aadhar_number: z
    .string()
    .regex(/^[0-9]{12}$/, "Must be exactly 12 digits"),
  property_location: z.string().min(1, "Required"),
  rent_amount: z.number().min(1, "Must be greater than 0"),
  due_day: z.number().int().min(1, "Min 1").max(28, "Max 28"),
  amount_paid: z.boolean(),
})

export type RecordFormData = z.infer<typeof recordSchema>

export const customColumnSchema = z.object({
  name: z.string().min(1, "Column name required").max(50, "Max 50 characters"),
  data_type: z.enum(["text", "numeric", "date", "boolean"]),
})

export type CustomColumnFormData = z.infer<typeof customColumnSchema>
