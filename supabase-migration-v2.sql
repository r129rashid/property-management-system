-- ============================================================
-- V2 Migration: Monthly Rent Cycle
-- Run this in your Supabase SQL editor (dashboard → SQL editor)
-- ============================================================

-- 1. Add due_day to records
ALTER TABLE records ADD COLUMN IF NOT EXISTS due_day integer;

-- 2. Backfill due_day from existing due_date values
UPDATE records
SET due_day = EXTRACT(DAY FROM due_date::date)::integer
WHERE due_date IS NOT NULL AND due_day IS NULL;

-- 3. Make due_day NOT NULL (backfill guarantees all rows have it)
ALTER TABLE records ALTER COLUMN due_day SET NOT NULL;

-- 4. Make due_date nullable — keep existing data, stop requiring it for new records
ALTER TABLE records ALTER COLUMN due_date DROP NOT NULL;

-- 5. Create rent_payments table
CREATE TABLE IF NOT EXISTS rent_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id     uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month         text NOT NULL,          -- YYYY-MM
  amount_due    numeric NOT NULL,
  paid          boolean NOT NULL DEFAULT false,
  paid_on       date,
  excused       boolean NOT NULL DEFAULT false,
  carried_from  uuid REFERENCES rent_payments(id),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(record_id, month)
);

-- 6. RLS
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rent_payments"
  ON rent_payments FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
