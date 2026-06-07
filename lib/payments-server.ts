import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, RecordRow, RentPaymentRow } from "@/types/database"
import { currentMonthStr, getProratedAmount, isActiveInMonth } from "./payments"

type DB = SupabaseClient<Database>

/**
 * Ensure a rent_payments row exists for the CURRENT month for every active lease.
 *
 * Idempotent: relies on UNIQUE(record_id, month) + ignoreDuplicates, so calling
 * it on every page load only ever inserts the rows that are genuinely missing
 * and never touches existing (excused / already-paid) rows.
 *
 * New rows mirror records.amount_paid so the ledger reflects exactly what the app
 * already shows — no status behavior changes.
 *
 * Returns the rows it inserted (so callers can merge them into their own map).
 */
export async function ensureCurrentMonthRows(
  supabase: DB,
  records: RecordRow[],
  existingRecordIds: Set<string>,
  userId: string
): Promise<RentPaymentRow[]> {
  const month = currentMonthStr()
  const today = new Date().toISOString().slice(0, 10)

  const toInsert = records
    .filter((r) => isActiveInMonth(r, month) && !existingRecordIds.has(r.id))
    .map((r) => {
      const amountDue = getProratedAmount(r, month)
      return {
        record_id: r.id,
        user_id: userId,
        month,
        amount_due: amountDue,
        paid: r.amount_paid,
        paid_on: r.amount_paid ? today : null,
        paid_amount: r.amount_paid ? amountDue : 0,
      }
    })

  if (toInsert.length === 0) return []

  const { data } = await supabase
    .from("rent_payments")
    .upsert(toInsert, { onConflict: "record_id,month", ignoreDuplicates: true })
    .select("*")

  return data ?? []
}
