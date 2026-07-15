"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { APP_TITLE, LOGO_SRC } from "@/lib/constants"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV = [
  { href: "/",       label: "Board" },
  { href: "/phases", label: "Phases" },
  { href: "/admin",  label: "Admin" },
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background text-foreground">
      <div className="w-full px-4 h-14 flex items-center gap-4">
        {LOGO_SRC && (
          <Image
            src={LOGO_SRC}
            alt={`${APP_TITLE} logo`}
            width={28}
            height={28}
            className="shrink-0"
          />
        )}
        <span className="text-sm font-semibold tracking-tight shrink-0">
          {APP_TITLE}
        </span>

        {/* Nav links */}
        <nav className="flex items-center gap-1 ml-4">
          {NAV.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
