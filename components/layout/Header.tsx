"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Building2, LayoutDashboard, FileText, Clock, LogOut } from "lucide-react"
import { toast } from "sonner"
import { DarkModeToggle } from "./DarkModeToggle"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/records": "Records",
  "/activity": "Activity",
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/activity", label: "Activity", icon: Clock },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const title =
    Object.entries(PAGE_TITLES).find(
      ([key]) => pathname === key || pathname.startsWith(key + "/")
    )?.[1] ?? "PropManage"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out")
    router.push("/login")
    router.refresh()
    setOpen(false)
  }

  return (
    <>
      <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-sm font-semibold">{title}</h1>
        </div>
        <DarkModeToggle />
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-black/40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border/50 flex flex-col px-3 py-4 md:hidden"
            >
              <div className="flex items-center gap-2.5 px-3 mb-8">
                <div className="p-1.5 rounded-lg bg-indigo-500/10">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="font-semibold text-sm tracking-tight">PropManage</span>
              </div>
              <nav className="flex-1 space-y-0.5">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const active =
                    pathname === href || (href !== "/" && pathname.startsWith(href + "/"))
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        active
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  )
                })}
              </nav>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
