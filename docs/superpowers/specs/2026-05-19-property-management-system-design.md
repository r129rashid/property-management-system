# Property Management System — Design Spec
**Date:** 2026-05-19  
**Status:** Approved  

---

## 1. Purpose & Scope

A responsive, single-user-per-account SaaS web app for Indian landlords to manage rental properties, tenants, and rent collection. Each authenticated user sees only their own data (enforced via Supabase RLS). The app replaces paper ledgers and spreadsheets with a modern, mobile-first dashboard.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14+ App Router + TypeScript | SSR, file-based routing, free on Vercel |
| Styling | Tailwind CSS + shadcn/ui | Consistent design tokens, accessible primitives |
| Animation | Framer Motion | Smooth transitions ≤300ms, micro-interactions |
| Auth / DB | Supabase (free tier) | Postgres + Auth + RLS + Storage, no backend code needed |
| Forms | React Hook Form + Zod | Type-safe validation, no re-renders |
| Tables | TanStack Table v8 | Sort, filter, paginate client-side |
| Icons | lucide-react | Consistent icon set |
| Charts | Recharts | Bar + Donut charts for dashboard |
| Dates | date-fns | Lightweight date manipulation |
| Toasts | Sonner | Minimal, accessible notifications |
| PDF | jsPDF + jspdf-autotable | Client-side receipt generation |
| Font | Geist (next/font) | Matches modern design aesthetic |
| Deployment | Vercel (free tier) | Zero-config Next.js deployment |

---

## 3. Architecture

```
Browser (Next.js App Router)
    │
    ├── (auth)/login, signup          — public routes
    ├── (dashboard)/dashboard         — protected, SSR KPIs
    ├── (dashboard)/records           — protected, TanStack Table
    └── (dashboard)/records/[id]      — protected, detail slide-over
    │
    └── Supabase (hosted Postgres)
            ├── auth.users            — built-in Supabase Auth
            ├── records               — property/tenant rows + JSONB custom_fields
            └── custom_columns        — per-user column definitions
```

**Data flow:**
- All DB reads/writes go via `@supabase/ssr` server components for dashboard (SSR) and `@supabase/supabase-js` browser client for mutations.
- RLS policies ensure every query is automatically scoped to `auth.uid()`.
- No separate API routes needed — Supabase client handles auth tokens.

---

## 4. Database Schema

```sql
-- Records table
create table records (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  property_name    text not null,
  tenant_name      text not null,
  contact_number   text not null check (contact_number ~ '^[0-9]{10}$'),
  aadhar_number    text not null check (aadhar_number ~ '^[0-9]{12}$'),
  property_location text not null,
  rent_amount      numeric not null,
  due_date         date not null,
  amount_paid      boolean not null default false,
  custom_fields    jsonb default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Custom column definitions
create table custom_columns (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  data_type  text not null check (data_type in ('text','numeric','date','boolean')),
  created_at timestamptz default now()
);

-- RLS
alter table records enable row level security;
alter table custom_columns enable row level security;
create policy "own records" on records for all using (auth.uid() = user_id);
create policy "own columns" on custom_columns for all using (auth.uid() = user_id);
```

---

## 5. Features

### 5.1 Authentication
- Supabase Auth: email + password sign-up, login, logout, password reset
- Next.js middleware (`middleware.ts`) redirects unauthenticated users to `/login`
- Session managed via `@supabase/ssr` cookies — no localStorage

### 5.2 Records — Core Fields
| Field | Type | Rule |
|---|---|---|
| Property Name | text | required, max 100 |
| Tenant Name | text | required |
| Contact Number | text | exactly 10 digits |
| Aadhar Number | text | exactly 12 digits; **masked** in UI as `XXXX-XXXX-1234` |
| Property Location | textarea | required |
| Rent Amount | numeric | INR, formatted `₹12,500` |
| Due Date | date picker | highlight red if overdue |
| Amount Paid | boolean | checkbox |

### 5.3 Dynamic Custom Columns
- "Add Column" modal: name + type (text / numeric / date / boolean)
- Values stored in `records.custom_fields` JSONB; definitions in `custom_columns` table
- Rendered dynamically in table and edit form
- Deletable with confirmation (removes key from all existing JSONB rows in background)

### 5.4 CRUD
- **Add:** slide-up modal with full form
- **Edit:** same modal pre-filled
- **Delete:** confirmation dialog
- **View:** slide-over detail panel showing all fields

### 5.5 Table View
- TanStack Table: sortable columns, search across text fields
- Filters: Paid/Unpaid, Overdue/Upcoming, By Property
- Status pills: **Paid** (green), **Due Soon** ≤5 days (amber), **Overdue** (red)
- Mobile: card layout below `md` breakpoint
- Empty state with illustration + CTA
- Skeleton loaders during fetch

### 5.6 Dashboard
- KPI cards: Total Properties, Total Tenants, Rent Collected (month), Rent Pending, Overdue Count
- Animated number counters (Framer Motion)
- Bar chart: rent collected per month, last 6 months (Recharts)
- Donut chart: Paid vs Unpaid this month (Recharts)
- Upcoming Dues list: next 5 by due date

### 5.7 Additional Features
- Dark mode toggle — Tailwind `dark:` classes, persisted in localStorage
- Bulk mark as paid — checkbox column, toolbar action
- Toast notifications — every create/update/delete/error (Sonner)
- Activity log — last 20 actions stored in `localStorage`
- Document upload — Supabase Storage private bucket, lease PDF or Aadhar per record
- Auto-status — overdue computed from `due_date` vs `new Date()` at render
- Confirmation modals on all destructive actions
- Loading states — skeletons, button spinners, optimistic UI on paid toggle
- Accessibility — ARIA labels, focus traps in modals, keyboard navigation

### 5.8 Receipt PDF
- Triggered from any paid record
- Output: property name, tenant name, amount (formatted), due date, paid date, unique receipt number (`RCP-{year}-{uuid-short}`)
- Generated client-side via jsPDF + jspdf-autotable

---

## 6. File Structure

```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
  (dashboard)/
    dashboard/page.tsx
    records/page.tsx
    records/[id]/page.tsx
  layout.tsx
  globals.css
middleware.ts
components/
  ui/                      # shadcn components
  forms/
    RecordForm.tsx
  table/
    RecordsTable.tsx
    AddColumnDialog.tsx
  dashboard/
    KpiCard.tsx
    RentChart.tsx
    DonutChart.tsx
    UpcomingDues.tsx
  layout/
    Sidebar.tsx
    Header.tsx
    DarkModeToggle.tsx
  shared/
    ConfirmDialog.tsx
    ActivityLog.tsx
    DocumentUpload.tsx
lib/
  supabase/
    client.ts
    server.ts
  validations/
    record.ts              # Zod schemas
  utils.ts
  pdf.ts                   # receipt generation
types/
  database.ts              # Supabase generated types
```

---

## 7. Design System

- **Accent color:** Indigo `#6366F1` (primary actions, highlights)
- **Status colors:** `green-500` paid, `amber-500` due soon, `red-500` overdue
- **Typography:** Geist font via `next/font`
- **Radius:** `rounded-xl` on cards, `rounded-lg` on inputs/buttons
- **Shadows:** `shadow-sm` default, `shadow-md` on modals
- **Spacing:** Tailwind default scale
- **Animations:** Framer Motion, max 300ms, ease-out
- **Dark mode:** class-based (`dark:`), toggle persisted in localStorage

---

## 8. Supabase Setup Instructions

1. Go to [supabase.com](https://supabase.com) → New project → choose a name, database password, region
2. After project creation: **Settings → API** → copy `Project URL` and `anon public` key
3. In `.env.local`: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Open **SQL Editor** → run the schema SQL from section 4
5. Go to **Storage** → create a bucket named `documents`, set to **private**
6. Run `npx supabase gen types typescript --project-id <your-project-id> > types/database.ts` to regenerate types

---

## 9. Build Order

1. Project setup: `create-next-app`, Tailwind, shadcn, folder structure
2. Supabase client setup + `.env.local` template
3. Auth pages (login, signup) + middleware route protection
4. Layout shell: sidebar/header navigation + dark mode toggle
5. Records page: TanStack table + add/edit form (core fields)
6. Custom columns feature (JSONB + `custom_columns` table)
7. Dashboard: KPI cards + Recharts charts
8. Polish: Framer Motion animations, empty states, skeletons, toasts, bulk actions
9. Receipt PDF generation
10. Responsive pass (375px → 1920px) + accessibility audit

---

## 10. Acceptance Criteria

- [ ] Login/signup/logout/password-reset work end-to-end with Supabase Auth
- [ ] Unauthenticated users are redirected from protected routes
- [ ] Full CRUD on records with Zod validation
- [ ] Contact = exactly 10 digits (UI + DB constraint)
- [ ] Aadhar = exactly 12 digits + masked display (`XXXX-XXXX-1234`)
- [ ] Custom columns: add, render in table/form, delete with confirmation
- [ ] Dashboard charts render real Supabase data
- [ ] Receipt PDF generates correctly for paid records
- [ ] Fully responsive 375px → 1920px
- [ ] Dark mode works and persists across sessions
- [ ] No console errors, no TypeScript errors (`tsc --noEmit` passes)
- [ ] Lighthouse mobile score ≥ 90
