"use client"

import { usePathname } from "next/navigation"
import { DarkModeToggle } from "./DarkModeToggle"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/records": "Records",
}

export function Header() {
  const pathname = usePathname()
  const title =
    Object.entries(PAGE_TITLES).find(
      ([key]) => pathname === key || pathname.startsWith(key + "/")
    )?.[1] ?? "PropManage"

  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-sm font-semibold">{title}</h1>
      <DarkModeToggle />
    </header>
  )
}
