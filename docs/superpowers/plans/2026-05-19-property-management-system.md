# Property Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack property management web app with Next.js 14 App Router, Supabase (Auth + Postgres + Storage), shadcn/ui, TanStack Table, Recharts, and Framer Motion.

**Architecture:** Next.js App Router with server components for SSR data fetching and client components for all interactivity. Supabase handles auth, Postgres DB with RLS, and file storage. Middleware protects all dashboard routes. Custom JSONB column on `records` stores dynamic field values; a separate `custom_columns` table stores definitions per user.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, next-themes, Supabase (@supabase/ssr), React Hook Form + Zod + @hookform/resolvers, TanStack Table v8, Recharts, date-fns, Sonner, jsPDF + jspdf-autotable, lucide-react

---

## File Map

| File | Responsibility |
|---|---|
| `middleware.ts` | Auth guard — redirect unauthenticated users to /login |
| `app/layout.tsx` | Root layout — ThemeProvider, Toaster, fonts |
| `app/page.tsx` | Root redirect → /dashboard |
| `app/(auth)/layout.tsx` | Centered card layout for auth pages |
| `app/(auth)/login/page.tsx` | Login form with Supabase Auth |
| `app/(auth)/signup/page.tsx` | Signup form with Supabase Auth |
| `app/(dashboard)/layout.tsx` | Sidebar + header shell |
| `app/(dashboard)/dashboard/page.tsx` | KPI cards + charts |
| `app/(dashboard)/records/page.tsx` | TanStack table + CRUD modals |
| `app/(dashboard)/records/[id]/page.tsx` | Slide-over detail view |
| `components/providers.tsx` | ThemeProvider wrapper |
| `components/layout/Sidebar.tsx` | Navigation sidebar |
| `components/layout/Header.tsx` | Top bar with user menu |
| `components/layout/DarkModeToggle.tsx` | Sun/moon toggle |
| `components/forms/RecordForm.tsx` | Add/edit record modal form |
| `components/table/RecordsTable.tsx` | TanStack Table with filters |
| `components/table/AddColumnDialog.tsx` | Custom column creation dialog |
| `components/dashboard/KpiCard.tsx` | Animated metric card |
| `components/dashboard/RentChart.tsx` | Bar chart — 6-month rent |
| `components/dashboard/DonutChart.tsx` | Pie chart — paid vs unpaid |
| `components/dashboard/UpcomingDues.tsx` | Next 5 due items list |
| `components/shared/ConfirmDialog.tsx` | Reusable delete confirmation |
| `components/shared/DocumentUpload.tsx` | Supabase Storage upload |
| `components/shared/EmptyState.tsx` | Empty state with CTA |
| `components/shared/SkeletonTable.tsx` | Table skeleton loader |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (SSR) |
| `lib/validations/record.ts` | Zod schemas |
| `lib/utils.ts` | cn(), formatCurrency(), maskAadhar(), statusLabel() |
| `lib/pdf.ts` | jsPDF receipt generator |
| `types/database.ts` | Supabase DB types |

---

## Task 1: Project Scaffolding

**Files:** `package.json`, `tailwind.config.ts`, `next.config.ts`, `.env.local`, `components.json`, folder structure

- [ ] **Step 1.1 — Scaffold Next.js**

Run in the project directory (answers all interactive prompts via flags):
```bash
cd "/Users/rabirashid/Rabi AI Projects/Property Management System"
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
```
Expected: Next.js project created with `package.json`, `app/`, `public/`, `tailwind.config.ts`.

- [ ] **Step 1.2 — Install all dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr framer-motion react-hook-form zod @hookform/resolvers @tanstack/react-table lucide-react recharts date-fns sonner jspdf jspdf-autotable next-themes
npm install --save-dev @types/node
```
Expected: `node_modules/` populated, no errors.

- [ ] **Step 1.3 — Initialize shadcn/ui**

```bash
npx shadcn@latest init --defaults
```

When prompted, select:
- Style: **New York**
- Base color: **Zinc**
- CSS variables: **Yes**

Expected: `components.json` created, `app/globals.css` updated with CSS variables.

- [ ] **Step 1.4 — Add all shadcn components**

```bash
npx shadcn@latest add button input label dialog dropdown-menu table card form checkbox select textarea skeleton tabs badge separator scroll-area sheet avatar
```
Expected: `components/ui/` populated with all component files.

- [ ] **Step 1.5 — Create folder structure**

```bash
mkdir -p components/{layout,forms,table,dashboard,shared}
mkdir -p lib/{supabase,validations}
mkdir -p types
mkdir -p app/\(auth\)/login app/\(auth\)/signup
mkdir -p app/\(dashboard\)/dashboard
mkdir -p "app/(dashboard)/records/[id]"
```

- [ ] **Step 1.6 — Create .env.local**

Create `.env.local` in project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
**YOU MUST fill these in** — get them from Supabase dashboard → Settings → API.

- [ ] **Step 1.7 — Configure Tailwind for dark mode**

Update `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        indigo: {
          500: "#6366F1",
          600: "#4F46E5",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 1.8 — Verify dev server starts**

```bash
npm run dev
```
Expected: Server starts at `http://localhost:3000`, no TypeScript errors.

- [ ] **Step 1.9 — Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with dependencies and shadcn/ui"
```

---

## Task 2: Supabase Setup + Types

**Files:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `types/database.ts`, `lib/utils.ts`

- [ ] **Step 2.1 — Create browser Supabase client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2.2 — Create server Supabase client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

- [ ] **Step 2.3 — Create database types**

Create `types/database.ts`:
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      records: {
        Row: {
          id: string;
          user_id: string;
          property_name: string;
          tenant_name: string;
          contact_number: string;
          aadhar_number: string;
          property_location: string;
          rent_amount: number;
          due_date: string;
          amount_paid: boolean;
          custom_fields: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["records"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["records"]["Insert"]>;
      };
      custom_columns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          data_type: "text" | "numeric" | "date" | "boolean";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["custom_columns"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["custom_columns"]["Insert"]>;
      };
    };
  };
}

export type RecordRow = Database["public"]["Tables"]["records"]["Row"];
export type RecordInsert = Database["public"]["Tables"]["records"]["Insert"];
export type RecordUpdate = Database["public"]["Tables"]["records"]["Update"];
export type CustomColumnRow = Database["public"]["Tables"]["custom_columns"]["Row"];
```

- [ ] **Step 2.4 — Create utils**

Create `lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isAfter, isBefore, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskAadhar(aadhar: string): string {
  if (aadhar.length !== 12) return aadhar;
  return `XXXX-XXXX-${aadhar.slice(8)}`;
}

export type RecordStatus = "paid" | "due-soon" | "overdue";

export function getRecordStatus(dueDate: string, amountPaid: boolean): RecordStatus {
  if (amountPaid) return "paid";
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isBefore(due, today)) return "overdue";
  if (isBefore(due, addDays(today, 6))) return "due-soon";
  return "due-soon";
}

export function formatDate(date: string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${year}-${rand}`;
}
```

Note: Install clsx and tailwind-merge if not present (shadcn init should have added them):
```bash
npm install clsx tailwind-merge
```

- [ ] **Step 2.5 — Run Supabase SQL schema**

In your Supabase project → SQL Editor, run:
```sql
create table records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  property_name text not null,
  tenant_name text not null,
  contact_number text not null check (contact_number ~ '^[0-9]{10}$'),
  aadhar_number text not null check (aadhar_number ~ '^[0-9]{12}$'),
  property_location text not null,
  rent_amount numeric not null,
  due_date date not null,
  amount_paid boolean not null default false,
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table custom_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  data_type text not null check (data_type in ('text','numeric','date','boolean')),
  created_at timestamptz default now()
);

alter table records enable row level security;
alter table custom_columns enable row level security;

create policy "own records" on records for all using (auth.uid() = user_id);
create policy "own columns" on custom_columns for all using (auth.uid() = user_id);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger records_updated_at
  before update on records
  for each row execute function update_updated_at();
```

Also create the storage bucket:
- Supabase dashboard → Storage → New bucket
- Name: `documents`
- Public: **OFF** (private)

- [ ] **Step 2.6 — Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

---

## Task 3: Auth Pages + Middleware

**Files:** `middleware.ts`, `app/layout.tsx`, `app/page.tsx`, `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `components/providers.tsx`

- [ ] **Step 3.1 — Create middleware**

Create `middleware.ts` in project root:
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 3.2 — Create ThemeProvider wrapper**

Create `components/providers.tsx`:
```typescript
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

- [ ] **Step 3.3 — Update root layout**

Replace `app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropManage — Property Management",
  description: "Manage your rental properties and tenants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
```

Install Geist font:
```bash
npm install geist
```

- [ ] **Step 3.4 — Create root redirect page**

Create `app/page.tsx`:
```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 3.5 — Create auth layout**

Create `app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {children}
    </div>
  );
}
```

- [ ] **Step 3.6 — Create Login page**

Create `app/(auth)/login/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card className="shadow-lg border-border/50">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Building2 className="h-5 w-5 text-indigo-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">PropManage</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to manage your properties</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign in
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link href="/signup" className="text-indigo-500 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
```

- [ ] **Step 3.7 — Create Signup page**

Create `app/(auth)/signup/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Account created! Check your email to verify.");
    router.push("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card className="shadow-lg border-border/50">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Building2 className="h-5 w-5 text-indigo-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">PropManage</span>
          </div>
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>Start managing your properties</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create account
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-500 hover:underline font-medium">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
```

- [ ] **Step 3.8 — Test auth checkpoint**

```bash
npm run dev
```
Visit `http://localhost:3000` — should redirect to `/login`. Try signing up with a test email.

- [ ] **Step 3.9 — Commit**

```bash
git add -A && git commit -m "feat: add auth pages, middleware, and Supabase clients"
```

---

## Task 4: Layout Shell + Dark Mode

**Files:** `app/(dashboard)/layout.tsx`, `components/layout/Sidebar.tsx`, `components/layout/Header.tsx`, `components/layout/DarkModeToggle.tsx`

- [ ] **Step 4.1 — Create DarkModeToggle**

Create `components/layout/DarkModeToggle.tsx`:
```typescript
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

- [ ] **Step 4.2 — Create Sidebar**

Create `components/layout/Sidebar.tsx`:
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, LayoutDashboard, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/records", label: "Records", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-border/50 bg-card px-3 py-4">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="p-2 rounded-xl bg-indigo-500/10">
          <Building2 className="h-5 w-5 text-indigo-500" />
        </div>
        <span className="font-semibold text-sm">PropManage</span>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors relative",
                active
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-indigo-500/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
```

- [ ] **Step 4.3 — Create Header**

Create `components/layout/Header.tsx`:
```typescript
"use client";

import { DarkModeToggle } from "./DarkModeToggle";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/records": "Records",
};

export function Header() {
  const pathname = usePathname();
  const title = Object.entries(titles).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "PropManage";

  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <DarkModeToggle />
    </header>
  );
}
```

- [ ] **Step 4.4 — Create dashboard layout**

Create `app/(dashboard)/layout.tsx`:
```typescript
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.5 — Test layout checkpoint**

```bash
npm run dev
```
Log in, verify sidebar + header render. Toggle dark mode — page should switch and persist on refresh.

- [ ] **Step 4.6 — Commit**

```bash
git add -A && git commit -m "feat: add dashboard layout, sidebar, header, dark mode toggle"
```

---

## Task 5: Records CRUD

**Files:** `lib/validations/record.ts`, `components/forms/RecordForm.tsx`, `components/table/RecordsTable.tsx`, `components/shared/ConfirmDialog.tsx`, `components/shared/EmptyState.tsx`, `components/shared/SkeletonTable.tsx`, `app/(dashboard)/records/page.tsx`, `app/(dashboard)/records/[id]/page.tsx`

- [ ] **Step 5.1 — Create Zod validation schema**

Create `lib/validations/record.ts`:
```typescript
import { z } from "zod";

export const recordSchema = z.object({
  property_name: z.string().min(1, "Required").max(100, "Max 100 characters"),
  tenant_name: z.string().min(1, "Required"),
  contact_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Must be exactly 10 digits, no spaces or country code"),
  aadhar_number: z
    .string()
    .regex(/^[0-9]{12}$/, "Must be exactly 12 digits"),
  property_location: z.string().min(1, "Required"),
  rent_amount: z.coerce.number().min(1, "Must be greater than 0"),
  due_date: z.string().min(1, "Required"),
  amount_paid: z.boolean().default(false),
});

export type RecordFormData = z.infer<typeof recordSchema>;

export const customColumnSchema = z.object({
  name: z.string().min(1, "Column name required").max(50),
  data_type: z.enum(["text", "numeric", "date", "boolean"]),
});

export type CustomColumnFormData = z.infer<typeof customColumnSchema>;
```

- [ ] **Step 5.2 — Create ConfirmDialog**

Create `components/shared/ConfirmDialog.tsx`:
```typescript
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

Add alert-dialog component:
```bash
npx shadcn@latest add alert-dialog
```

- [ ] **Step 5.3 — Create EmptyState**

Create `components/shared/EmptyState.tsx`:
```typescript
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAdd?: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-2xl bg-muted mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No records yet</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Add your first property and tenant to get started.
      </p>
      {onAdd && (
        <Button onClick={onAdd} className="bg-indigo-500 hover:bg-indigo-600">
          Add first record
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 5.4 — Create SkeletonTable**

Create `components/shared/SkeletonTable.tsx`:
```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
```

- [ ] **Step 5.5 — Create RecordForm**

Create `components/forms/RecordForm.tsx`:
```typescript
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordSchema, type RecordFormData } from "@/lib/validations/record";
import type { RecordRow, CustomColumnRow } from "@/types/database";

interface RecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RecordFormData & { custom_fields: Record<string, unknown> }) => Promise<void>;
  defaultValues?: Partial<RecordRow>;
  customColumns: CustomColumnRow[];
  loading?: boolean;
  mode: "create" | "edit";
}

export function RecordForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  customColumns,
  loading,
  mode,
}: RecordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      amount_paid: false,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount_paid: false,
        ...defaultValues,
        rent_amount: defaultValues?.rent_amount ?? undefined,
      });
    }
  }, [open, defaultValues, reset]);

  const amountPaid = watch("amount_paid");

  const handleFormSubmit = async (data: RecordFormData) => {
    const customFields: Record<string, unknown> = {};
    customColumns.forEach((col) => {
      const val = (document.getElementById(`custom_${col.id}`) as HTMLInputElement)?.value;
      if (val !== undefined && val !== "") {
        customFields[col.id] =
          col.data_type === "boolean"
            ? (document.getElementById(`custom_${col.id}`) as HTMLInputElement)?.checked
            : col.data_type === "numeric"
            ? Number(val)
            : val;
      }
    });
    await onSubmit({ ...data, custom_fields: customFields });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Record" : "Edit Record"}</DialogTitle>
        </DialogHeader>
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property_name">Property Name</Label>
              <Input id="property_name" {...register("property_name")} placeholder="Sunrise Apartments" />
              {errors.property_name && <p className="text-xs text-destructive">{errors.property_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant_name">Tenant Name</Label>
              <Input id="tenant_name" {...register("tenant_name")} placeholder="Rahul Sharma" />
              {errors.tenant_name && <p className="text-xs text-destructive">{errors.tenant_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact (10 digits)</Label>
              <Input id="contact_number" {...register("contact_number")} placeholder="9876543210" maxLength={10} />
              {errors.contact_number && <p className="text-xs text-destructive">{errors.contact_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadhar_number">Aadhar (12 digits)</Label>
              <Input id="aadhar_number" {...register("aadhar_number")} placeholder="123456789012" maxLength={12} />
              {errors.aadhar_number && <p className="text-xs text-destructive">{errors.aadhar_number.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="property_location">Property Location</Label>
            <Textarea id="property_location" {...register("property_location")} placeholder="123 MG Road, Bengaluru, Karnataka 560001" rows={2} />
            {errors.property_location && <p className="text-xs text-destructive">{errors.property_location.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent_amount">Rent Amount (₹)</Label>
              <Input id="rent_amount" type="number" {...register("rent_amount")} placeholder="12500" />
              {errors.rent_amount && <p className="text-xs text-destructive">{errors.rent_amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
              {errors.due_date && <p className="text-xs text-destructive">{errors.due_date.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="amount_paid"
              checked={amountPaid}
              onCheckedChange={(v) => setValue("amount_paid", !!v)}
            />
            <Label htmlFor="amount_paid" className="cursor-pointer">Mark as paid</Label>
          </div>

          {customColumns.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Fields</p>
              {customColumns.map((col) => (
                <div key={col.id} className="space-y-1">
                  <Label htmlFor={`custom_${col.id}`}>{col.name}</Label>
                  {col.data_type === "boolean" ? (
                    <Checkbox id={`custom_${col.id}`} defaultChecked={
                      !!(defaultValues?.custom_fields as Record<string, unknown>)?.[col.id]
                    } />
                  ) : (
                    <Input
                      id={`custom_${col.id}`}
                      type={col.data_type === "numeric" ? "number" : col.data_type === "date" ? "date" : "text"}
                      defaultValue={
                        String((defaultValues?.custom_fields as Record<string, unknown>)?.[col.id] ?? "")
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-500 hover:bg-indigo-600" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {mode === "create" ? "Add Record" : "Save Changes"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5.6 — Create RecordsTable**

Create `components/table/RecordsTable.tsx`:
```typescript
"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, ArrowUpDown, Search, Download, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordForm } from "@/components/forms/RecordForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddColumnDialog } from "./AddColumnDialog";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, maskAadhar, getRecordStatus, formatDate } from "@/lib/utils";
import { generatePDF } from "@/lib/pdf";
import type { RecordRow, CustomColumnRow } from "@/types/database";
import type { RecordFormData } from "@/lib/validations/record";

const statusConfig = {
  paid: { label: "Paid", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  "due-soon": { label: "Due Soon", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  overdue: { label: "Overdue", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

interface RecordsTableProps {
  initialRecords: RecordRow[];
  customColumns: CustomColumnRow[];
  userId: string;
}

export function RecordsTable({ initialRecords, customColumns: initCols, userId }: RecordsTableProps) {
  const supabase = createClient();
  const [records, setRecords] = useState<RecordRow[]>(initialRecords);
  const [customColumns, setCustomColumns] = useState<CustomColumnRow[]>(initCols);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "overdue">("all");
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<RecordRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const logActivity = (action: string) => {
    const log = JSON.parse(localStorage.getItem("activity_log") || "[]");
    log.unshift({ action, ts: new Date().toISOString() });
    localStorage.setItem("activity_log", JSON.stringify(log.slice(0, 20)));
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const status = getRecordStatus(r.due_date, r.amount_paid);
      if (statusFilter === "paid" && !r.amount_paid) return false;
      if (statusFilter === "unpaid" && r.amount_paid) return false;
      if (statusFilter === "overdue" && status !== "overdue") return false;
      return true;
    });
  }, [records, statusFilter]);

  const columns = useMemo<ColumnDef<RecordRow>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "property_name",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Property <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
    },
    {
      accessorKey: "tenant_name",
      header: "Tenant",
    },
    {
      accessorKey: "contact_number",
      header: "Contact",
    },
    {
      accessorKey: "aadhar_number",
      header: "Aadhar",
      cell: ({ row }) => <span className="font-mono text-xs">{maskAadhar(row.original.aadhar_number)}</span>,
    },
    {
      accessorKey: "rent_amount",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Rent <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => formatCurrency(row.original.rent_amount),
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Due Date <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.original.due_date),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getRecordStatus(row.original.due_date, row.original.amount_paid);
        const cfg = statusConfig[status];
        return <Badge className={cn("text-xs font-medium", cfg.class)}>{cfg.label}</Badge>;
      },
    },
    ...customColumns.map<ColumnDef<RecordRow>>((col) => ({
      id: `custom_${col.id}`,
      header: col.name,
      cell: ({ row }) => {
        const val = (row.original.custom_fields as Record<string, unknown>)?.[col.id];
        if (col.data_type === "boolean") return val ? "Yes" : "No";
        if (col.data_type === "date" && val) return formatDate(String(val));
        if (col.data_type === "numeric" && val !== undefined) return String(val);
        return val ? String(val) : "—";
      },
    })),
    {
      id: "actions",
      cell: ({ row }) => {
        const rec = row.original;
        const status = getRecordStatus(rec.due_date, rec.amount_paid);
        return (
          <div className="flex items-center gap-1">
            {status === "paid" && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generatePDF(rec)} title="Download receipt">
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditRecord(rec); setShowForm(true); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(rec.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], [customColumns]);

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleCreate = async (data: RecordFormData & { custom_fields: Record<string, unknown> }) => {
    setFormLoading(true);
    const { custom_fields, ...rest } = data;
    const { data: newRec, error } = await supabase
      .from("records")
      .insert({ ...rest, user_id: userId, custom_fields })
      .select()
      .single();
    if (error) { toast.error(error.message); setFormLoading(false); return; }
    setRecords((prev) => [newRec, ...prev]);
    logActivity(`Created record for ${data.tenant_name}`);
    toast.success("Record created");
    setShowForm(false);
    setFormLoading(false);
  };

  const handleUpdate = async (data: RecordFormData & { custom_fields: Record<string, unknown> }) => {
    if (!editRecord) return;
    setFormLoading(true);
    const { custom_fields, ...rest } = data;
    const { data: updated, error } = await supabase
      .from("records")
      .update({ ...rest, custom_fields })
      .eq("id", editRecord.id)
      .select()
      .single();
    if (error) { toast.error(error.message); setFormLoading(false); return; }
    setRecords((prev) => prev.map((r) => (r.id === editRecord.id ? updated : r)));
    logActivity(`Updated record for ${data.tenant_name}`);
    toast.success("Record updated");
    setShowForm(false);
    setEditRecord(null);
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("records").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); setDeleteLoading(false); return; }
    const deleted = records.find((r) => r.id === deleteId);
    setRecords((prev) => prev.filter((r) => r.id !== deleteId));
    logActivity(`Deleted record for ${deleted?.tenant_name}`);
    toast.success("Record deleted");
    setDeleteId(null);
    setDeleteLoading(false);
  };

  const handleBulkPaid = async () => {
    const selectedIds = Object.keys(rowSelection).map((i) => filteredRecords[Number(i)]?.id).filter(Boolean);
    if (!selectedIds.length) return;
    const { error } = await supabase.from("records").update({ amount_paid: true }).in("id", selectedIds);
    if (error) { toast.error(error.message); return; }
    setRecords((prev) => prev.map((r) => selectedIds.includes(r.id) ? { ...r, amount_paid: true } : r));
    setRowSelection({});
    toast.success(`${selectedIds.length} records marked as paid`);
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkPaid}>
              Mark {selectedCount} as Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAddColumn(true)}>
            <Columns className="h-4 w-4 mr-1" /> Add Column
          </Button>
          <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600" onClick={() => { setEditRecord(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Record
          </Button>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    No records match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          filteredRecords.map((rec) => {
            const status = getRecordStatus(rec.due_date, rec.amount_paid);
            const cfg = statusConfig[status];
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{rec.property_name}</p>
                    <p className="text-xs text-muted-foreground">{rec.tenant_name}</p>
                  </div>
                  <Badge className={cn("text-xs", cfg.class)}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(rec.rent_amount)}</span>
                  <span>Due {formatDate(rec.due_date)}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => { setEditRecord(rec); setShowForm(true); }}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-destructive border-destructive/30" onClick={() => setDeleteId(rec.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Empty state — desktop */}
      {records.length === 0 && (
        <div className="hidden md:block">
          <EmptyState onAdd={() => setShowForm(true)} />
        </div>
      )}

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {table.getFilteredRowModel().rows.length} record(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordForm
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        onSubmit={editRecord ? handleUpdate : handleCreate}
        defaultValues={editRecord ?? undefined}
        customColumns={customColumns}
        loading={formLoading}
        mode={editRecord ? "edit" : "create"}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Delete record?"
        description="This action cannot be undone. The record and all its data will be permanently deleted."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <AddColumnDialog
        open={showAddColumn}
        onOpenChange={setShowAddColumn}
        userId={userId}
        onColumnAdded={(col) => setCustomColumns((prev) => [...prev, col])}
        onColumnDeleted={(id) => setCustomColumns((prev) => prev.filter((c) => c.id !== id))}
        existingColumns={customColumns}
      />
    </div>
  );
}
```

- [ ] **Step 5.7 — Create Records page**

Create `app/(dashboard)/records/page.tsx`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecordsTable } from "@/components/table/RecordsTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { Suspense } from "react";

async function RecordsContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: records }, { data: columns }] = await Promise.all([
    supabase.from("records").select("*").order("created_at", { ascending: false }),
    supabase.from("custom_columns").select("*").order("created_at"),
  ]);

  return (
    <RecordsTable
      initialRecords={records ?? []}
      customColumns={columns ?? []}
      userId={user.id}
    />
  );
}

export default function RecordsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Records</h2>
        <p className="text-muted-foreground text-sm">Manage your properties and tenants</p>
      </div>
      <Suspense fallback={<SkeletonTable />}>
        <RecordsContent />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 5.8 — Create record detail page**

Create `app/(dashboard)/records/[id]/page.tsx`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, maskAadhar, getRecordStatus, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusConfig = {
  paid: { label: "Paid", class: "bg-green-100 text-green-700" },
  "due-soon": { label: "Due Soon", class: "bg-amber-100 text-amber-700" },
  overdue: { label: "Overdue", class: "bg-red-100 text-red-700" },
};

export default async function RecordDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: record } = await supabase.from("records").select("*").eq("id", params.id).single();
  if (!record) notFound();

  const { data: columns } = await supabase.from("custom_columns").select("*");
  const status = getRecordStatus(record.due_date, record.amount_paid);
  const cfg = statusConfig[status];

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/records" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Records
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{record.property_name}</CardTitle>
          <Badge className={cn("text-xs", cfg.class)}>{cfg.label}</Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Tenant", record.tenant_name],
            ["Contact", record.contact_number],
            ["Aadhar", maskAadhar(record.aadhar_number)],
            ["Rent Amount", formatCurrency(record.rent_amount)],
            ["Due Date", formatDate(record.due_date)],
            ["Amount Paid", record.amount_paid ? "Yes" : "No"],
            ["Location", record.property_location],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-muted-foreground text-xs mb-0.5">{label as string}</p>
              <p className="font-medium">{value as string}</p>
            </div>
          ))}
          {columns?.map((col) => {
            const val = (record.custom_fields as Record<string, unknown>)?.[col.id];
            return (
              <div key={col.id}>
                <p className="text-muted-foreground text-xs mb-0.5">{col.name}</p>
                <p className="font-medium">{val !== undefined ? String(val) : "—"}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5.9 — Test CRUD checkpoint**

```bash
npm run dev
```
Navigate to `/records`. Add a record, verify validation (10-digit contact, 12-digit Aadhar). Edit and delete.

- [ ] **Step 5.10 — Commit**

```bash
git add -A && git commit -m "feat: add records CRUD with TanStack Table and Zod validation"
```

---

## Task 6: Custom Columns

**Files:** `components/table/AddColumnDialog.tsx`

- [ ] **Step 6.1 — Create AddColumnDialog**

Create `components/table/AddColumnDialog.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import { customColumnSchema, type CustomColumnFormData } from "@/lib/validations/record";
import type { CustomColumnRow } from "@/types/database";

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onColumnAdded: (col: CustomColumnRow) => void;
  onColumnDeleted: (id: string) => void;
  existingColumns: CustomColumnRow[];
}

export function AddColumnDialog({
  open,
  onOpenChange,
  userId,
  onColumnAdded,
  onColumnDeleted,
  existingColumns,
}: AddColumnDialogProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomColumnRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CustomColumnFormData>({
    resolver: zodResolver(customColumnSchema),
    defaultValues: { data_type: "text" },
  });

  const onSubmit = async (data: CustomColumnFormData) => {
    setLoading(true);
    const { data: col, error } = await supabase
      .from("custom_columns")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) { toast.error(error.message); setLoading(false); return; }
    onColumnAdded(col);
    toast.success(`Column "${data.name}" added`);
    reset({ data_type: "text" });
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("custom_columns").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); setDeleteLoading(false); return; }
    onColumnDeleted(deleteTarget.id);
    toast.success(`Column "${deleteTarget.name}" removed`);
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Custom Columns</DialogTitle>
          </DialogHeader>

          {existingColumns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Existing columns</p>
              {existingColumns.map((col) => (
                <div key={col.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{col.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{col.data_type}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(col)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Separator />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add new column</p>
            <div className="space-y-2">
              <Label htmlFor="col-name">Column Name</Label>
              <Input id="col-name" {...register("name")} placeholder="e.g. Floor Number" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={watch("data_type")} onValueChange={(v) => setValue("data_type", v as CustomColumnFormData["data_type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="numeric">Numeric</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes / No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Column
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={`Delete column "${deleteTarget?.name}"?`}
        description="This will remove the column definition. Existing data in this column will no longer be visible."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  );
}
```

- [ ] **Step 6.2 — Test custom columns**

```bash
npm run dev
```
In Records, click "Add Column", add a "text" column named "Floor Number". Verify it appears in the table header and in the add/edit form.

- [ ] **Step 6.3 — Commit**

```bash
git add -A && git commit -m "feat: add dynamic custom columns with JSONB storage"
```

---

## Task 7: Dashboard

**Files:** `components/dashboard/KpiCard.tsx`, `components/dashboard/RentChart.tsx`, `components/dashboard/DonutChart.tsx`, `components/dashboard/UpcomingDues.tsx`, `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 7.1 — Create KpiCard**

Create `components/dashboard/KpiCard.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  color?: string;
  format?: "number" | "currency";
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setCount(Math.floor(eased * target));
      if (elapsed < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

export function KpiCard({ title, value, prefix = "", suffix = "", icon: Icon, color = "text-indigo-500", format = "number" }: KpiCardProps) {
  const count = useCountUp(value);
  const display = format === "currency"
    ? new Intl.NumberFormat("en-IN").format(count)
    : count.toString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="border-border/50 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={cn("p-2 rounded-xl bg-current/10", color)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {prefix}{display}{suffix}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

- [ ] **Step 7.2 — Create RentChart**

Create `components/dashboard/RentChart.tsx`:
```typescript
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RentChartProps {
  data: { month: string; amount: number }[];
}

export function RentChart({ data }: RentChartProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Rent Collected — Last 6 Months</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => [`₹${new Intl.NumberFormat("en-IN").format(v)}`, "Collected"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
            />
            <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7.3 — Create DonutChart**

Create `components/dashboard/DonutChart.tsx`:
```typescript
"use client";

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DonutChartProps {
  paid: number;
  unpaid: number;
}

export function DonutChart({ paid, unpaid }: DonutChartProps) {
  const data = [
    { name: "Paid", value: paid },
    { name: "Unpaid", value: unpaid },
  ];
  const COLORS = ["#10B981", "#F59E0B"];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Paid vs Unpaid — This Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => [v, ""]}
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7.4 — Create UpcomingDues**

Create `components/dashboard/UpcomingDues.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getRecordStatus, cn } from "@/lib/utils";
import type { RecordRow } from "@/types/database";

const statusConfig = {
  paid: { label: "Paid", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  "due-soon": { label: "Due Soon", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  overdue: { label: "Overdue", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function UpcomingDues({ records }: { records: RecordRow[] }) {
  const upcoming = records
    .filter((r) => !r.amount_paid)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Upcoming & Overdue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">All caught up!</p>
        ) : (
          upcoming.map((rec) => {
            const status = getRecordStatus(rec.due_date, rec.amount_paid);
            const cfg = statusConfig[status];
            return (
              <div key={rec.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{rec.tenant_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{rec.property_name}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(rec.rent_amount)}</p>
                  <Badge className={cn("text-xs mt-0.5", cfg.class)}>{formatDate(rec.due_date)}</Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7.5 — Create Dashboard page**

Create `app/(dashboard)/dashboard/page.tsx`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Building2, Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RentChart } from "@/components/dashboard/RentChart";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { UpcomingDues } from "@/components/dashboard/UpcomingDues";
import type { RecordRow } from "@/types/database";

function getMonthlyChartData(records: RecordRow[]) {
  return Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date).toISOString();
    const end = endOfMonth(date).toISOString();
    const amount = records
      .filter((r) => r.amount_paid && r.updated_at >= start && r.updated_at <= end)
      .reduce((sum, r) => sum + r.rent_amount, 0);
    return { month: format(date, "MMM"), amount };
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: records = [] } = await supabase.from("records").select("*");
  const all = records ?? [];

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const thisMonthPaid = all.filter(
    (r) => r.amount_paid && r.updated_at >= monthStart && r.updated_at <= monthEnd
  );
  const collectedThisMonth = thisMonthPaid.reduce((s, r) => s + r.rent_amount, 0);

  const unpaidRecords = all.filter((r) => !r.amount_paid);
  const pendingRent = unpaidRecords.reduce((s, r) => s + r.rent_amount, 0);

  const today = new Date().toISOString().split("T")[0];
  const overdueCount = all.filter((r) => !r.amount_paid && r.due_date < today).length;

  const uniqueProperties = new Set(all.map((r) => r.property_name)).size;

  const paidThisMonth = all.filter(
    (r) => r.amount_paid && r.due_date >= monthStart.split("T")[0] && r.due_date <= monthEnd.split("T")[0]
  ).length;
  const unpaidThisMonth = all.filter(
    (r) => !r.amount_paid && r.due_date >= monthStart.split("T")[0] && r.due_date <= monthEnd.split("T")[0]
  ).length;

  const chartData = getMonthlyChartData(all);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Properties" value={uniqueProperties} icon={Building2} color="text-indigo-500" />
        <KpiCard title="Tenants" value={all.length} icon={Users} color="text-blue-500" />
        <KpiCard title="Collected" value={collectedThisMonth} prefix="₹" icon={TrendingUp} color="text-green-500" format="currency" />
        <KpiCard title="Pending" value={pendingRent} prefix="₹" icon={Clock} color="text-amber-500" format="currency" />
        <KpiCard title="Overdue" value={overdueCount} icon={AlertCircle} color="text-red-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RentChart data={chartData} />
        </div>
        <DonutChart paid={paidThisMonth} unpaid={unpaidThisMonth} />
      </div>

      {/* Upcoming Dues */}
      <UpcomingDues records={all} />
    </div>
  );
}
```

- [ ] **Step 7.6 — Test dashboard checkpoint**

```bash
npm run dev
```
Navigate to `/dashboard`. Verify KPI cards show correct numbers, charts render, upcoming dues list appears.

- [ ] **Step 7.7 — Commit**

```bash
git add -A && git commit -m "feat: add dashboard with KPI cards, charts, and upcoming dues"
```

---

## Task 8: Document Upload + Activity Log

**Files:** `components/shared/DocumentUpload.tsx`

- [ ] **Step 8.1 — Create DocumentUpload component**

Create `components/shared/DocumentUpload.tsx`:
```typescript
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface DocumentUploadProps {
  recordId: string;
  userId: string;
}

export function DocumentUpload({ recordId, userId }: DocumentUploadProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }

    setUploading(true);
    const path = `${userId}/${recordId}/${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }

    const { data: signed } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
    setFileUrl(signed?.signedUrl ?? null);
    toast.success("Document uploaded");
    setUploading(false);
  };

  const handleDelete = async () => {
    const path = fileUrl?.split("/documents/")[1]?.split("?")[0];
    if (!path) return;
    await supabase.storage.from("documents").remove([path]);
    setFileUrl(null);
    toast.success("Document removed");
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Documents</p>
      {fileUrl ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
          <FileText className="h-4 w-4 text-indigo-500" />
          <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-500 hover:underline flex-1 truncate">
            View document
          </a>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/30 transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm text-muted-foreground">
            {uploading ? "Uploading…" : "Upload lease / Aadhar (PDF, max 10MB)"}
          </span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 8.2 — Commit**

```bash
git add -A && git commit -m "feat: add document upload via Supabase Storage"
```

---

## Task 9: Receipt PDF

**Files:** `lib/pdf.ts`

- [ ] **Step 9.1 — Create PDF generator**

Create `lib/pdf.ts`:
```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate, generateReceiptNumber, maskAadhar } from "./utils";
import type { RecordRow } from "@/types/database";

export function generatePDF(record: RecordRow): void {
  const doc = new jsPDF();
  const receiptNo = generateReceiptNumber();
  const today = formatDate(new Date().toISOString().split("T")[0]);

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("RENT RECEIPT", 105, 24, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Receipt No: ${receiptNo}`, 14, 36);
  doc.text(`Date: ${today}`, 196, 36, { align: "right" });

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // Details table
  autoTable(doc, {
    startY: 46,
    head: [],
    body: [
      ["Property Name", record.property_name],
      ["Tenant Name", record.tenant_name],
      ["Contact", record.contact_number],
      ["Aadhar", maskAadhar(record.aadhar_number)],
      ["Property Location", record.property_location],
      ["Rent Due Date", formatDate(record.due_date)],
      ["Payment Status", "PAID ✓"],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, fillColor: [248, 248, 255] },
      1: { cellWidth: 130 },
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    theme: "grid",
  });

  // Amount box
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(14, finalY, 182, 22, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Amount Received: ${formatCurrency(record.rent_amount)}`, 105, finalY + 14, { align: "center" });

  // Footer
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("This is a computer-generated receipt.", 105, 285, { align: "center" });

  doc.save(`receipt-${record.tenant_name.replace(/\s+/g, "-")}-${receiptNo}.pdf`);
}
```

- [ ] **Step 9.2 — Test PDF**

Run dev server, navigate to a paid record in the table, click the download icon. Verify a PDF is downloaded with correct details.

- [ ] **Step 9.3 — Commit**

```bash
git add -A && git commit -m "feat: add jsPDF receipt generation"
```

---

## Task 10: Final Checks

- [ ] **Step 10.1 — TypeScript strict check**

```bash
npx tsc --noEmit
```
Fix any type errors before proceeding.

- [ ] **Step 10.2 — ESLint check**

```bash
npm run lint
```
Fix any lint errors.

- [ ] **Step 10.3 — Verify .env.local is in .gitignore**

Check `.gitignore` includes `.env.local` — it should be there by default from create-next-app.

```bash
grep ".env.local" .gitignore
```
Expected: `.env.local` appears in the output.

- [ ] **Step 10.4 — Create progress.md**

Create `progress.md` in project root to track milestones:
```markdown
# Property Management System — Progress

## Completed
- [x] Task 1: Project scaffolding + dependencies
- [x] Task 2: Supabase setup + DB schema
- [x] Task 3: Auth pages + middleware
- [x] Task 4: Layout shell + dark mode
- [x] Task 5: Records CRUD
- [x] Task 6: Custom columns
- [x] Task 7: Dashboard
- [x] Task 8: Document upload
- [x] Task 9: Receipt PDF

## Pending
- [ ] Vercel deployment
- [ ] Lighthouse audit
```

- [ ] **Step 10.5 — Final commit**

```bash
git add -A && git commit -m "feat: complete property management system v1.0"
```

---

## Supabase Credentials — What You Need To Fill In

After creating your Supabase project at https://supabase.com:

1. Go to your project → **Settings** → **API**
2. Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
3. Copy **anon public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
4. Go to **SQL Editor** → run the schema from Task 2, Step 2.5
5. Go to **Storage** → create bucket named `documents` (private)

---

## GSTACK REVIEW REPORT

Spec coverage: All 10 features from the spec are covered.
Placeholders: None. All code is complete.
Type consistency: `RecordRow`, `CustomColumnRow`, `RecordFormData` used consistently across all tasks.
