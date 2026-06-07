-- ============================================================
-- V3 Migration: Real Payments Ledger
-- Run this in your Supabase SQL editor (dashboard → SQL editor)
-- AFTER supabase-migration-v2.sql and supabase-migration-v2-patch1.sql
--
-- Backward-compatible: only ADDS two nullable/defaulted columns to
-- rent_payments. No existing column, row, policy, or behavior changes.
-- ============================================================

-- Amount actually received for the month (0 until a payment is recorded).
ALTER TABLE rent_payments
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0;

-- How the payment was made: Cash / UPI / Bank transfer / Cheque / Other.
ALTER TABLE rent_payments
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Helpful index for month-range trend queries (no-op if it already exists).
CREATE INDEX IF NOT EXISTS rent_payments_user_month_idx
  ON rent_payments (user_id, month);
