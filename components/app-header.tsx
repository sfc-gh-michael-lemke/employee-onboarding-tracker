"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { APP_TITLE, LOGO_SRC } from "@/lib/constants"
import { ThemeToggle } from "@/components/theme-toggle"

const ADMIN_LINKS = [
  { href: "/admin/employees", label: "Employees", description: "Add, edit, manage employee records" },
  { href: "/admin/phases",    label: "Phases",    description: "Configure onboarding phases and tasks" },
]

export function AppHeader() {
  const pathname = usePathname()
  const [adminOpen, setAdminOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const isAdminActive = pathname.startsWith("/admin")

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setAdminOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

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

        <nav className="flex items-center gap-1 ml-4">
          {/* Board */}
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              pathname === "/"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Board
          </Link>

          {/* Admin dropdown */}
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setAdminOpen(o => !o)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                isAdminActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Admin
              <svg
                className={`w-3 h-3 transition-transform ${adminOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {adminOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/admin"
                  onClick={() => setAdminOpen(false)}
                  className={`block px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted transition-colors ${
                    pathname === "/admin" ? "text-primary" : ""
                  }`}
                >
                  Overview
                </Link>
                <div className="border-t border-border my-1" />
                {ADMIN_LINKS.map(({ href, label, description }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setAdminOpen(false)}
                    className={`block px-4 py-2.5 hover:bg-muted transition-colors ${
                      pathname === href ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`text-sm font-medium ${pathname === href ? "text-primary" : "text-foreground"}`}>
                      {label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
