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
