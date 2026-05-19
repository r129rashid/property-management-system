"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Building2, LayoutDashboard, FileText, Clock, LogOut } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/activity", label: "Activity", icon: Clock },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out")
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-border/50 bg-card px-3 py-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="p-1.5 rounded-lg bg-indigo-500/10">
          <Building2 className="h-4 w-4 text-indigo-500" />
        </div>
        <span className="font-semibold text-sm tracking-tight">PropManage</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href + "/"))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-xl bg-indigo-500/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    </aside>
  )
}
