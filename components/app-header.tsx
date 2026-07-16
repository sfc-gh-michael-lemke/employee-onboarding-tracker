"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { APP_TITLE, LOGO_SRC } from "@/lib/constants"
import { ThemeToggle } from "@/components/theme-toggle"

interface Board { ID: string; NAME: string }

let boardsCache: Board[] = []
let boardsCacheAt = 0
const BOARDS_TTL = 30_000

const ADMIN_LINKS = [
  { href: "/admin/employees", label: "Employees", description: "Add, edit, manage employee records" },
  { href: "/admin/phases",    label: "Phases",    description: "Configure onboarding phases and tasks" },
]

function NavDropdown({
  label, isActive, children,
}: { label: string; isActive: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        {label}
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-64 bg-background border border-border rounded-lg shadow-lg py-1 z-50"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function AppHeader() {
  const pathname = usePathname()
  const [boards, setBoards] = useState<Board[]>([])

  useEffect(() => {
    if (Date.now() - boardsCacheAt < BOARDS_TTL) {
      setBoards(boardsCache)
      return
    }
    fetch("/api/boards")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          boardsCache = data
          boardsCacheAt = Date.now()
          setBoards(data)
        }
      })
      .catch(() => {})
  }, []) // cache hit avoids re-fetching on every nav

  const isBoardActive = pathname === "/boards" || pathname.startsWith("/boards/")
  const isAdminActive = pathname.startsWith("/admin")

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background text-foreground">
      <div className="w-full px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          {LOGO_SRC && (
            <Image src={LOGO_SRC} alt={`${APP_TITLE} logo`} width={28} height={28} className="shrink-0" />
          )}
          <span className="text-sm font-semibold tracking-tight shrink-0">{APP_TITLE}</span>
        </Link>

        <nav className="flex items-center gap-1 ml-4">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              pathname === "/"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Home
          </Link>

          {/* Boards dropdown */}
          <NavDropdown label="Boards" isActive={isBoardActive}>
            <Link
              href="/boards"
              className={`block px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted transition-colors ${pathname === "/boards" ? "text-primary" : ""}`}
            >
              All Boards
            </Link>
            {boards.length > 0 && <div className="border-t border-border my-1" />}
            {boards.map(b => (
              <Link
                key={b.ID}
                href={`/boards/${b.ID}`}
                className={`block px-4 py-2.5 hover:bg-muted transition-colors ${pathname === `/boards/${b.ID}` ? "bg-primary/5" : ""}`}
              >
                <div className={`text-sm font-medium ${pathname === `/boards/${b.ID}` ? "text-primary" : "text-foreground"}`}>
                  {b.NAME}
                </div>
              </Link>
            ))}
            <div className="border-t border-border my-1" />
            <Link
              href="/boards/new"
              className="block px-4 py-2.5 hover:bg-muted transition-colors"
            >
              <div className="text-sm font-medium text-blue-600">+ New Board</div>
              <div className="text-xs text-muted-foreground mt-0.5">Import from a document with AI</div>
            </Link>
          </NavDropdown>

          {/* Admin dropdown */}
          <NavDropdown label="Admin" isActive={isAdminActive}>
            <Link
              href="/admin"
              className={`block px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted transition-colors ${pathname === "/admin" ? "text-primary" : ""}`}
            >
              Overview
            </Link>
            <div className="border-t border-border my-1" />
            {ADMIN_LINKS.map(({ href, label, description }) => (
              <Link
                key={href}
                href={href}
                className={`block px-4 py-2.5 hover:bg-muted transition-colors ${pathname === href ? "bg-primary/5" : ""}`}
              >
                <div className={`text-sm font-medium ${pathname === href ? "text-primary" : "text-foreground"}`}>{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
              </Link>
            ))}
          </NavDropdown>
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
