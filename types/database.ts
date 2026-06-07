export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      records: {
        Row: {
          id: string
          user_id: string
          property_name: string
          tenant_name: string
          contact_number: string
          aadhar_number: string
          property_location: string
          rent_amount: number
          due_day: number
          due_date: string | null
          lease_start: string | null
          amount_paid: boolean
          custom_fields: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_name: string
          tenant_name: string
          contact_number: string
          aadhar_number: string
          property_location: string
          rent_amount: number
          due_day: number
          due_date?: string | null
          lease_start?: string | null
          amount_paid?: boolean
          custom_fields?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_name?: string
          tenant_name?: string
          contact_number?: string
          aadhar_number?: string
          property_location?: string
          rent_amount?: number
          due_day?: number
          due_date?: string | null
          lease_start?: string | null
          amount_paid?: boolean
          custom_fields?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rent_payments: {
        Row: {
          id: string
          record_id: string
          user_id: string
          month: string
          amount_due: number
          paid: boolean
          paid_on: string | null
          paid_amount: number
          payment_method: string | null
          excused: boolean
          carried_from: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          record_id: string
          user_id: string
          month: string
          amount_due: number
          paid?: boolean
          paid_on?: string | null
          paid_amount?: number
          payment_method?: string | null
          excused?: boolean
          carried_from?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          record_id?: string
          user_id?: string
          month?: string
          amount_due?: number
          paid?: boolean
          paid_on?: string | null
          paid_amount?: number
          payment_method?: string | null
          excused?: boolean
          carried_from?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      custom_columns: {
        Row: {
          id: string
          user_id: string
          name: string
          data_type: "text" | "numeric" | "date" | "boolean"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          data_type: "text" | "numeric" | "date" | "boolean"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          data_type?: "text" | "numeric" | "date" | "boolean"
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type RecordRow = Database["public"]["Tables"]["records"]["Row"]
export type RecordInsert = Database["public"]["Tables"]["records"]["Insert"]
export type RecordUpdate = Database["public"]["Tables"]["records"]["Update"]
export type CustomColumnRow = Database["public"]["Tables"]["custom_columns"]["Row"]
export type RentPaymentRow = Database["public"]["Tables"]["rent_payments"]["Row"]
export type RentPaymentInsert = Database["public"]["Tables"]["rent_payments"]["Insert"]
export type RentPaymentUpdate = Database["public"]["Tables"]["rent_payments"]["Update"]
