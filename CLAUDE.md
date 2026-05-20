@AGENTS.md

# Property Management System

A full-stack rental property management web app built with Next.js 16, Supabase, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 16.2.6 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config, no `tailwind.config.ts`) + shadcn/ui v4.7.0 (radix-nova preset, OKLCH colors)
- **Auth + DB**: Supabase (SSR via `@supabase/ssr`) with Row Level Security
- **UI**: Framer Motion v12, Recharts v3, TanStack Table v8, Sonner toasts
- **Forms**: React Hook Form v7 + Zod v4 + `@hookform/resolvers` v5
- **PDF**: jsPDF v4 + jspdf-autotable

## Key Conventions

- Dark mode: `@custom-variant dark (&:is(.dark *))` in `globals.css` + `next-themes` with `attribute="class"` and **`defaultTheme="dark"`** (no `enableSystem`) — whole app is dark by default
- Tailwind v4: all theme config lives in `globals.css` `@theme` block — no `tailwind.config.ts`
- Supabase types: use `export type Database` (not `interface`) with `Relationships: []` per table and `{ [_ in never]: never }` for Views/Functions/Enums/CompositeTypes
- Zod + RHF: use `z.number()` (not `z.coerce.number()`) + `{ valueAsNumber: true }` in `register()` for number fields
- `custom_fields` JSONB: cast to `Json` type when inserting/updating via Supabase client
- Next.js 16: `params` is `Promise<{ id: string }>` — must `await params`
- Activity log: stored in `localStorage` under key `pms_activity_log`, max 20 entries
- `KpiCard` accepts optional `href?: string` — wraps in `<Link>` when provided (used for click-through to filtered records)
- `RecordsTable` reads `?status` URL search param via `useSearchParams()` to initialise `statusFilter` — navigate to `/records?status=overdue` to pre-filter
- Auth layout: `"use client"` with 5 Framer Motion animated gradient orbs + dot-grid + vignette; forces `class="dark"` so login is always dark
- Login card: glass morphism (`rgba(15,18,35,0.75)` + `backdrop-blur(24px)`), not shadcn Card; staggered entrance animations
- Remember Me: saves email to `localStorage` key `pms_remembered_email`; loaded via `useEffect` + `setValue` on mount; never saves password
- Brand name: "Abhay's PMS" (not PropManage)

## Project Structure

```
app/
  (auth)/login        # Login page
  (auth)/signup       # Signup page
  (dashboard)/
    dashboard/        # KPI cards + charts
    records/          # Records table + CRUD
    records/[id]/     # Record detail + document upload
    activity/         # Activity log
components/
  dashboard/          # KpiCard, RentChart, StatusDonut, UpcomingDues
  forms/              # RecordForm
  layout/             # Sidebar, Header, DarkModeToggle
  shared/             # ConfirmDialog, EmptyState, SkeletonTable, DocumentUpload, ActivityLog
  table/              # RecordsTable, AddColumnDialog
lib/
  supabase/           # client.ts + server.ts
  validations/        # record.ts (Zod schemas)
  pdf.ts              # Receipt PDF generation
  utils.ts            # cn, formatCurrency, maskAadhar, getRecordStatus, formatDate
types/
  database.ts         # Supabase Database type + Row/Insert/Update helpers
```

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
