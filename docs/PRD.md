# PRD — Payments Ledger, Auto-Generated Months, Dashboard Trends & WhatsApp Reminders

**Product:** Abhay's PMS (app brand) · "Rabi's Property Management Solutions" (deliverables)
**Status:** Approved for build · **Branch:** `feature/payments-ledger-whatsapp`
**Author:** Engineering · **Date:** 2026-06-07

---

## 1. Background — Current Functionality (what exists today)

A single-landlord rental management web app (Next.js 16 / React 19 / Supabase / Tailwind v4 / shadcn). Live on Vercel.

**Auth**
- Supabase email/password login + signup. Animated dark glass login, "Remember Me" (email only).
- Route protection via Next.js 16 `proxy.ts` (the renamed Middleware) + in-page `getUser()` checks.

**Rental Ledger (`/records`)**
- Full CRUD of leases. Each record = property + tenant + lease: property name, tenant, contact (10-digit), Aadhar (12-digit, masked in UI), location, `rent_amount`, `due_day` (1–28), `lease_start`, `amount_paid` (boolean).
- Search, status filter (All/Paid/Unpaid/Overdue), sortable columns, pagination, row selection + bulk "mark paid".
- Inline "Mark as paid", three-dot menu (Edit, Payment History, Mark paid/unpaid, Download receipt, Delete), custom columns (text/number/date/boolean), mobile card layout.

**Status model (single source of truth)**
- `records.amount_paid` (boolean) = sole source of paid/unpaid for the **current month**.
- `rent_payments.excused` (boolean, per month) = sole source of excused.
- `getRecordStatus(due_day, amount_paid)` → `paid | upcoming | due-soon | overdue`; effective status layers excused on top.

**Dashboard (`/dashboard`)**
- KPI row 1: Total Properties, Total Tenants (distinct by Aadhar), Overdue.
- KPI row 2: Receivable / Collected / Outstanding for the current month (prorated for first month).
- Payment Status donut (Paid/Upcoming/Due Soon/Overdue), Upcoming/Overdue list, privacy toggle (mask amounts).

**Admin Console (`/admin`)** — month picker; excuse / un-excuse rent per tenant per month. Excused rent is excluded from outstanding + overdue.

**Other** — Payment History dialog (reads `rent_payments`); PDF rent receipts (jsPDF); document upload per record (Supabase Storage); activity log (localStorage, last 20).

**Data tables** — `records`, `rent_payments` (id, record_id, user_id, month `YYYY-MM`, amount_due, paid, paid_on, excused, carried_from, notes; UNIQUE(record_id, month)), `custom_columns`. All under RLS by `user_id`.

**Key limitation this PRD addresses:** "paid" is a boolean with no amount, date, or method; `rent_payments` rows are only created when excusing, so there is no real per-month payment history and no income trend.

---

## 2. Problem Statement

The landlord can mark a month "paid" but cannot record **how much** was received, **when**, or **how** (cash/UPI/bank). There is no automatic monthly ledger, no income trend over time, and no way to nudge tenants about due/overdue rent. This makes bookkeeping, follow-ups, and year-end statements manual and error-prone.

## 3. Goals

1. Record a real payment per month (amount, date, method) — not just a boolean — with **zero change** to how status is displayed today.
2. The monthly ledger **populates itself** for active leases instead of only when excusing.
3. The dashboard shows a **6-month Receivable vs Collected trend**.
4. The landlord can send a **WhatsApp rent reminder** in one tap (wa.me click-to-send — no paid API).
5. Every screen is **fully usable on mobile**.
6. **No regression** to any existing feature.

## 4. Non-Goals (explicitly out of scope for v1)

- **Partial / installment payments** — v1 records full payments only (per user decision). Schema leaves room (`paid_amount`) but UI is full-only.
- **Automated/scheduled WhatsApp sending (Twilio/Meta API)** — v1 is click-to-send links; no background jobs, no credentials, no message-template approval.
- **Online rent collection (UPI/Razorpay)** — separate initiative.
- **Property as a first-class entity / multi-unit / multi-landlord** — record stays property+tenant+lease.
- **Monthly auto-reset of `amount_paid`** — pre-existing behavior is preserved as-is to avoid regressions.
- **Backfilling fabricated historical payment data** — trend uses analytic receivable + real collected only.

## 5. Users & Stories

Primary user: the landlord (single operator).

- As a landlord, I want to record a rent payment with amount, date and method so that I have an accurate record.
- As a landlord, I want each tenant's months to appear automatically so that I don't manually create entries.
- As a landlord, I want to see whether collections are trending up or down over recent months.
- As a landlord, I want to send a tenant a WhatsApp reminder about due/overdue rent in one tap.
- As a landlord on my phone, I want every page to be usable without horizontal scrolling or clipped controls.

## 6. Requirements

### P0 — Must have

**6.1 Payments ledger**
- Migration adds `payment_method text` and `paid_amount numeric NOT NULL DEFAULT 0` to `rent_payments`.
- "Record payment" UI (in the Payment History dialog, per month): amount (defaults to month's `amount_due`), date (defaults today), method (Cash/UPI/Bank transfer/Cheque/Other) → sets `paid=true, paid_on, paid_amount, payment_method`.
- **Sync invariant:** recording/clearing a payment for the **current** month also sets `records.amount_paid` accordingly; the existing quick "Mark as paid"/"Mark as unpaid" continue to work and also write the current-month ledger row. Status display logic is unchanged.
- Acceptance:
  - Given a tenant with no payment for June, when I record ₹12,500 on 5 June via UPI, then the June row shows Paid, ₹12,500, UPI, 05 Jun, and the table status shows Paid.
  - Given I clear the current month's payment, then `records.amount_paid` becomes false and status reverts to upcoming/due-soon/overdue.
  - Given an excused month, recording a payment is not offered (excused stays the source of truth).

**6.2 Auto-generated months**
- On dashboard/records server load, ensure a `rent_payments` row exists for the **current month** for every active lease (`lease_start <= current month`), with `amount_due` = prorated rent and `paid` mirrored from `records.amount_paid`. Idempotent (UNIQUE(record_id, month) + upsert-ignore); never overwrites excused or already-paid rows.
- Acceptance: given a new record added mid-month, when I open the dashboard, then its current-month ledger row exists with the prorated amount; reopening does not create duplicates.

**6.3 Dashboard trend**
- A 6-month "Receivable vs Collected" chart: Receivable = analytic sum of prorated rent per month (excluding months excused); Collected = sum of `paid_amount` from `rent_payments`.
- Respects privacy mode (hidden → values masked/blurred). Renders cleanly with no data.

**6.4 WhatsApp reminders**
- `buildWhatsAppReminder(record, status, amountDue)` → `https://wa.me/91<number>?text=<encoded message>`; opens in a new tab.
- Action available in the Records three-dot menu (desktop + mobile) for any non-paid, non-excused tenant, labelled "Send WhatsApp reminder".
- Message includes tenant name, property, month, amount due, due day, and whether overdue. Polite, India-context tone.
- Acceptance: tapping the action opens WhatsApp (app or web) with the tenant's number and a pre-filled message; no message is sent automatically.

**6.5 Mobile responsiveness**
- All pages usable at 360–414px width: no horizontal overflow, tap targets ≥ ~40px, dialogs fit viewport, KPI grids/forms reflow, tables use the existing card pattern.

### P1 — Nice to have (not blocking)
- Method + amount surfaced in the Payment History rows and on the PDF receipt.
- Trend chart toggle Receivable/Collected/Outstanding.

### P2 — Future (design for, don't build)
- Partial payments (schema already supports `paid_amount`).
- Scheduled automated reminders.

## 7. Success Metrics
- Leading: % of current-month rows with a recorded payment (target > 80% within 30 days); reminders sent/week.
- Lagging: reduced manual follow-up effort; complete year-end per-tenant statement available.

## 8. Open Questions
- (Resolved) WhatsApp delivery → wa.me click-to-send. Payments → full only.
- (Eng) Country code for wa.me is assumed `+91` (India). Flag if any tenant is non-India.

## 9. Rollout / Phasing
1. **Migration** (user runs `supabase-migration-v3.sql` in Supabase) — adds two columns. Backward-compatible.
2. **Phase 1** Payments ledger. **Phase 2** Auto-gen + trend. **Phase 3** WhatsApp. **Phase 4** Mobile pass.
3. Verify `tsc` + `next build` after each phase. Merge to `main` (auto-deploys) only after the migration is live.
