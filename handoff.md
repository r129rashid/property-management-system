# Handoff — Abhay's PMS

## Current State
App is live on Vercel (`property-management-system-coral.vercel.app`).
**V2 code is pushed but requires two DB migrations to be run in Supabase before it works in production.**

### Pending DB migrations (run in Supabase SQL editor in order)
1. `supabase-migration-v2.sql` — adds `due_day`, creates `rent_payments` table
2. `supabase-migration-v2-patch1.sql` — adds `lease_start` to records

---

## All Changes by Session

### Sessions 1–2: Core build + bug fixes
| What | Files |
|------|-------|
| Full app build: auth, dashboard, records CRUD, activity log, document upload | Multiple |
| Fix: dashboard crash — RSC serialization of Lucide icon forwardRef | `components/dashboard/KpiCard.tsx` |
| Fix: redirect() inside Suspense boundary | `app/(dashboard)/dashboard/page.tsx` |
| Fix: activity log "Invalid Date" | `components/table/RecordsTable.tsx`, `components/shared/ActivityLog.tsx` |

### Session 3: UI polish
| What | Files |
|------|-------|
| Records table three-dot menu: Edit / Delete / Generate Agreement | `components/table/RecordsTable.tsx` |
| Records table: quick inline "Mark as Paid" button | `components/table/RecordsTable.tsx` |
| Records page header → "Rental Ledger" | `app/(dashboard)/records/page.tsx` |
| Overdue KPI card clickable → `/records?status=overdue` | `components/dashboard/KpiCard.tsx`, `app/(dashboard)/dashboard/page.tsx` |
| RecordsTable reads `?status` URL param to initialise filter | `components/table/RecordsTable.tsx` |
| Login redesign: glass card, accent bar, show/hide password | `app/(auth)/login/page.tsx` |

### Session 4: Animated login + dark mode + brand
| What | Files |
|------|-------|
| Auth layout: 5 Framer Motion orbs, dot grid, vignette, forced dark | `app/(auth)/layout.tsx` |
| Login card: glass morphism, staggered entrance animations | `app/(auth)/login/page.tsx` |
| Brand: "PropManage" → "Abhay's PMS" | `app/(auth)/login/page.tsx`, `app/layout.tsx` |
| App-wide dark default: `defaultTheme="dark"`, no `enableSystem` | `components/providers.tsx` |
| Remember Me: saves email to localStorage, pre-fills on next visit | `app/(auth)/login/page.tsx` |

### Session 5: Paid status controls — desktop + mobile
| What | Files |
|------|-------|
| Desktop: "Mark as paid" quick button + in three-dot when unpaid; "Paid" label + "Mark as unpaid" in three-dot when paid | `components/table/RecordsTable.tsx` |
| Mobile bug fix: quick action was absent — mobile cards bypass TanStack columns; added directly to card JSX | `components/table/RecordsTable.tsx` |
| Mobile three-dot: "Mark as paid" / "Mark as unpaid" + Download receipt | `components/table/RecordsTable.tsx` |
| Added `handleMarkUnpaid` — sets `amount_paid: false` in Supabase | `components/table/RecordsTable.tsx` |

### Sessions 6–7: Dashboard financial KPIs + date + privacy toggle
| What | Files |
|------|-------|
| Two KPI rows: row 1 = Properties/Tenants/Overdue; row 2 = Receivable/Collected/Outstanding | `app/(dashboard)/dashboard/page.tsx` |
| Financial KPIs sum all records (monthly portfolio total, not date-filtered) | `app/(dashboard)/dashboard/page.tsx` |
| Month label subtitle on each financial card (e.g. "May 2026") | `components/dashboard/KpiCard.tsx` |
| Current date in dashboard header (weekday, day, month, year) | `app/(dashboard)/dashboard/page.tsx` |
| Eye/EyeOff privacy toggle — hides all KPI values as `₹ ••••` | `components/dashboard/PrivacyProvider.tsx`, `components/dashboard/PrivacyToggle.tsx` |
| `KpiCard`: optional `subtitle` prop, `amber` colour variant, reads PrivacyContext | `components/dashboard/KpiCard.tsx` |

### Sessions 8–9: V2 — Monthly Rent Cycle
| What | Files |
|------|-------|
| **`due_day`** (integer 1–28) replaces `due_date` calendar picker on all records | `types/database.ts`, `lib/validations/record.ts`, `lib/utils.ts` |
| `getRecordStatus(dueDay, amountPaid)` — computes overdue/due-soon against current month's Nth day | `lib/utils.ts` |
| `formatDueDay()` utility: 1→"1st", 15→"15th" | `lib/utils.ts` |
| RecordForm: date picker replaced with day-of-month number input (1–28) | `components/forms/RecordForm.tsx` |
| RecordsTable, UpcomingDues, Record detail, PDF receipt all updated to `due_day` | Multiple |
| **`lease_start`** date on every record — required in form, shown in detail page | `components/forms/RecordForm.tsx`, `app/(dashboard)/records/[id]/page.tsx` |
| **`rent_payments` table** — per-tenant per-month ledger (paid/excused) | `types/database.ts`, `supabase-migration-v2.sql` |
| **Admin Console** at `/admin` — month picker, Generate month, Mark paid, Excuse, Carry forward (initial) | `app/(dashboard)/admin/page.tsx`, `components/admin/AdminConsole.tsx` |
| Proration: first month rent = `round((days_active / days_in_month) × rent_amount)` | `components/admin/AdminConsole.tsx` |
| Tenants whose `lease_start` is after the selected month are skipped in Generate | `components/admin/AdminConsole.tsx` |
| Sidebar: Admin nav item added | `components/layout/Sidebar.tsx` |

### Session 10: V2 Refinements — Status Unification + Admin Redesign
| What | Files |
|------|-------|
| **Dashboard proration**: same `getProratedAmount()` logic as admin now applied to financial KPIs | `app/(dashboard)/dashboard/page.tsx` |
| **Dialog width fix**: removed `sm:max-w-sm` from `DialogContent` base class (was overriding consumer widths at ≥640px) | `components/ui/dialog.tsx`, `components/table/AddColumnDialog.tsx` |
| **RecordForm width**: widened to `max-w-3xl` (works correctly after dialog fix) | `components/forms/RecordForm.tsx` |
| **Dashboard chart removed**: 6-month area chart was broken (no data). Removed entirely. | `app/(dashboard)/dashboard/page.tsx` |
| **Status unification**: single source of truth — `records.amount_paid` owns paid/unpaid; `rent_payments.excused` owns excused per month | All three views |
| **Admin redesign**: removed Generate Month, Carry Forward, Mark Paid. Admin can ONLY excuse/un-excuse per month | `components/admin/AdminConsole.tsx` |
| **Payment History dialog**: three-dot menu in Records table now has "Payment History" — fetches all `rent_payments` for that tenant on open | `components/table/RecordsTable.tsx` |
| **`getEffectiveStatus()`**: unified function: excused (from paymentMap) → paid (from records.amount_paid) → overdue/due-soon | `components/table/RecordsTable.tsx` |
| **Dashboard `paymentMap`**: parallel-fetches current month's `rent_payments`, uses excused flag for status + financial KPIs | `app/(dashboard)/dashboard/page.tsx` |
| **Records page passes paymentMap**: server component fetches current month payments, passes to RecordsTable | `app/(dashboard)/records/page.tsx` |

---

## Key Conventions
- **Dark mode**: `ThemeProvider defaultTheme="dark"` — whole app dark by default
- **Auth layout**: `"use client"`, forces `class="dark"` — login always dark
- **Remember Me**: `pms_remembered_email` in localStorage (email only, never password)
- **KpiCard props**: `href` = clickable link; `subtitle` = secondary label; `color` = `indigo|violet|emerald|red|amber`
- **RecordsTable filter from URL**: `/records?status=overdue|paid|unpaid` pre-filters on load
- **Mobile records**: custom card rendering — NOT TanStack columns. Any new action must be added to mobile card JSX separately
- **`due_day`**: integer 1–28. `getRecordStatus(rec.due_day, rec.amount_paid)` everywhere
- **`rent_payments.month`**: always `YYYY-MM` text. UNIQUE(record_id, month) enforced at DB
- **Proration**: only applied in the matching YYYY-MM of `lease_start`. Full rent all other months
- **Privacy context**: `PrivacyProvider` wraps dashboard; `usePrivacy()` reads `hidden` state in any client component
- **Activity log**: `localStorage` key `pms_activity_log`, max 20 entries, format `{ message, timestamp: ISO string }`
- **Payment status architecture**: `records.amount_paid` (boolean) = sole source for paid/unpaid. `rent_payments.excused` (boolean) per month = sole source for excused. Status hierarchy everywhere: excused → paid → overdue/due-soon
- **Admin console scope**: Admin can ONLY excuse or un-excuse. Mark paid/unpaid is done from the Records table (Rental Ledger). No "Generate Month" or carry-forward.
- **Dialog widths**: `components/ui/dialog.tsx` base class has NO `sm:max-w-*`. Consumer passes its own width (e.g. RecordForm uses `max-w-3xl`, AddColumnDialog uses `sm:max-w-sm`)

## Known Open Issue
`proxy.ts` at project root is NOT recognised by Next.js as middleware:
- Named `proxy.ts` instead of `middleware.ts`, exports `proxy` not a default export
- Auth relies solely on in-page `redirect()` calls — no route-level protection
- **Fix:** rename → `middleware.ts`, `export default async function middleware`

## What the Next Session Could Do
- **Dashboard month picker** (Phase 4 of V2): prev/next navigation, financial KPIs pull from `rent_payments` for selected month
- Implement "Generate Agreement" PDF (jsPDF already installed)
- Fix middleware naming issue for proper route-level auth protection (`proxy.ts` → `middleware.ts`)
- Animated dark treatment on the signup page
- Signup page currently has no animation/glass treatment (only login does)
