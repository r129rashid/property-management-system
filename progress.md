# Property Management System — Build Progress

## Stack (actual)
- Next.js 16.2.6 + React 19 + TypeScript
- Tailwind CSS v4 (CSS-based config, no tailwind.config.ts)
- shadcn/ui v4.7.0 — radix-nova preset, OKLCH colors, tw-animate-css
- Supabase SSR, TanStack Table v8, Framer Motion v12, Recharts v3
- date-fns v4, Sonner v2, jsPDF v4, next-themes v0.4

## Tasks

- [x] Task 1: Project scaffolding (Next.js + deps + shadcn)
- [x] Task 2: Supabase clients + types
- [x] Task 3: Auth pages + middleware
- [x] Task 4: Layout shell + dark mode
- [x] Task 5: Records CRUD (table + form + PDF)
- [x] Task 6: Dashboard (KPIs + area chart + donut chart + upcoming dues)
- [x] Task 7: Document upload (Supabase Storage) + activity log page
- [x] Task 8: Final TypeScript clean + production build verified + mobile drawer added

- [x] Task 9: UI polish — records three-dot menu, quick Mark as Paid, dashboard click-through, login redesign
- [x] Task 10: Animated dark login — Mac screensaver orbs, glass card, Abhay's PMS brand
- [x] Task 11: Dark mode default app-wide, Remember Me (email only), title update

## Bug fixes applied (post-launch)
- Dashboard crash: RSC serialization of Lucide forwardRef icons — KpiCard.icon changed to ReactNode
- Dashboard redirect inside Suspense → moved auth check outside Suspense + force-dynamic
- Activity log "Invalid Date": schema mismatch in logActivity writer vs reader — fixed
- App defaulting to light theme post-login — fixed by changing ThemeProvider defaultTheme to "dark"

## Notes
- Directory name has spaces → project created in propmanage/ then moved to root
- Tailwind v4 uses @custom-variant dark (&:is(.dark *)) — class-based dark mode works with next-themes
- No tailwind.config.ts needed — all config via globals.css @theme block
- Geist fonts via next/font/google (already in Next.js 16 template)
- KpiCard accepts optional `href` prop — wraps in Link for click-through to filtered views
- RecordsTable reads `?status` URL search param on mount to init the status filter
- ThemeProvider: defaultTheme="dark", enableSystem removed — whole app is dark by default
- Auth layout: "use client" with 5 Framer Motion animated gradient orbs (indigo/violet/cyan/blue/pink)
- Login Remember Me: saves email to localStorage key `pms_remembered_email`; never saves password
- Brand name throughout: "Abhay's PMS"
- `proxy.ts` is NOT picked up by Next.js as middleware — must rename to `middleware.ts` and use `export default async function middleware` (known open issue)

---

## V2 — Monthly Rent Cycle System

### Overview
Convert from flat snapshot model to a proper monthly rent cycle.
Each lease (record) has a recurring due day. Every month generates payment entries.
Full payment history per tenant. Carry-forward and excuse actions in an admin console.

### Data Model Changes

**`records` table (becomes lease config)**
- Remove: `due_date` (calendar date) → make nullable during transition, backfill `due_day` from it
- Add: `due_day` integer 1–28 — "rent is due on the Nth of every month"

**New: `rent_payments` table**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `record_id` | uuid | FK → records (CASCADE) |
| `user_id` | uuid | FK → auth.users (RLS) |
| `month` | text | YYYY-MM |
| `amount_due` | numeric | snapshot of rent_amount at generation time |
| `paid` | boolean | default false |
| `paid_on` | date | nullable |
| `excused` | boolean | default false |
| `carried_from` | uuid | nullable FK → rent_payments |
| `notes` | text | nullable |
| `created_at` | timestamptz | |
| UNIQUE | (record_id, month) | one entry per tenant per month |

### Build Phases

**Phase 1 — DB Migration** ← USER ACTION REQUIRED
- [x] Migration SQL written → `supabase-migration-v2.sql`
- [ ] Run `supabase-migration-v2.sql` in Supabase SQL editor

**Phase 2 — Core: due_date → due_day**
- [x] `types/database.ts` — add due_day, nullable due_date, add rent_payments types
- [x] `lib/validations/record.ts` — swap due_date for due_day (z.number 1–28)
- [x] `lib/utils.ts` — getRecordStatus(dueDay: number), add formatDueDay()
- [x] `components/forms/RecordForm.tsx` — date picker → day-of-month number input
- [x] `components/table/RecordsTable.tsx` — update column display + all status logic
- [x] `components/dashboard/UpcomingDues.tsx` — formatDueDay instead of formatDate
- [x] `app/(dashboard)/records/[id]/page.tsx` — due_day in detail + payment history
- [x] `lib/pdf.ts` — "Due on Xth of every month" in receipt
- [x] `app/(dashboard)/dashboard/page.tsx` — updated getRecordStatus calls

**Phase 3 — Admin Console + Payment Log**
- [x] `supabase-migration-v2.sql` — rent_payments table + RLS
- [x] `app/(dashboard)/admin/page.tsx` — admin console page
- [x] `components/admin/AdminConsole.tsx` — generate month / mark paid / carry forward / excuse
- [x] Payment history on record detail page

**Phase 4 — Dashboard Month Picker** ← next session
- [ ] Month picker (prev/next) in dashboard header
- [ ] Financial KPIs query rent_payments for selected month
- [ ] 6-month chart pulls from rent_payments grouped by month

### Key V2 Conventions
- `due_day` is integer 1–28. Never 29–31 (avoids Feb edge case).
- `getRecordStatus(dueDay, amountPaid)` — computes against current month's Nth day.
- `rent_payments.month` is always `YYYY-MM`. UNIQUE(record_id, month) enforced at DB.
- Excused payments excluded from Outstanding and not counted as Overdue.
- Carry-forward: new payment row, `amount_due = base_rent + prev_unpaid`, `carried_from = prev_id`.
- Admin console at `/admin`. Sidebar link included.
