export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          due_date: string
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
          due_date: string
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
          due_date?: string
          amount_paid?: boolean
          custom_fields?: Json
          created_at?: string
          updated_at?: string
        }
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
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type RecordRow = Database["public"]["Tables"]["records"]["Row"]
export type RecordInsert = Database["public"]["Tables"]["records"]["Insert"]
export type RecordUpdate = Database["public"]["Tables"]["records"]["Update"]
export type CustomColumnRow = Database["public"]["Tables"]["custom_columns"]["Row"]
