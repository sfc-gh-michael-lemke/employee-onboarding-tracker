"use client"

import { useState } from "react"
import type { Phase, Link } from "@/lib/phases"
import { CheckCircle2, ChevronDown, ChevronRight, Circle, ExternalLink, Database, BookOpen, FlaskConical } from "lucide-react"

type TestStatus = "idle" | "running" | "pass" | "fail" | "no_employee"

export function PhaseSection({
  phase,
  checklist,
  isActive,
  isDone,
  isLocked,
  queries = {},
  testStatus = {},
  onToggle,
  onTest,
}: {
  phase: Phase
  checklist: Record<string, boolean>
  isActive: boolean
  isDone: boolean
  isLocked: boolean
  queries?: Record<string, string>
  testStatus?: Record<string, TestStatus>
  onToggle: (phaseKey: string, itemKey: string, isChecked: boolean) => void
  onTest?: (phaseKey: string, itemKey: string) => void
}) {
  const [open, setOpen] = useState(isActive)
  const checked = phase.items.filter((i) => checklist[i.key]).length

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        isDone
          ? "border-emerald-200 dark:border-emerald-800/50"
          : isActive
          ? "border-primary/30"
          : "border-border"
      }`}
    >
      {/* Phase header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
          isDone
            ? "bg-emerald-50/50 dark:bg-emerald-900/10"
            : isActive
            ? "bg-primary/5"
            : "bg-background hover:bg-muted/40"
        }`}
      >
        <span className="shrink-0 mt-0.5">
          {isDone ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : isLocked ? (
            <Circle size={16} className="text-muted-foreground/40" />
          ) : (
            <Circle size={16} className="text-primary" />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className={`text-sm font-medium block ${isLocked ? "text-muted-foreground" : ""}`}>
            {phase.label}
          </span>
          {phase.description && (
            <span className="text-xs text-muted-foreground leading-relaxed mt-0.5 block">
              {phase.description}
            </span>
          )}
          {phase.links && phase.links.length > 0 && (
            <span className="flex flex-wrap gap-1.5 mt-1.5">
              {phase.links.map((link) => (
                <LinkChip key={link.url + link.label} link={link} />
              ))}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {checked}/{phase.items.length}
          </span>
          {open ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
        </span>
      </button>

      {/* Items */}
      {open && (
        <ul className="border-t border-border divide-y divide-border/60 bg-muted/20 border-l-2 border-l-primary/20">
          {phase.items.map((item) => {
            const isChecked = checklist[item.key] ?? false
            const key       = `${phase.key}/${item.key}`
            const hasSql    = !!queries[key]
            const status    = testStatus[key] ?? "idle"

            return (
              <li key={item.key} className="pl-8 pr-4 py-2.5 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-2">
                  <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onToggle(phase.key, item.key, e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer mt-0.5 shrink-0"
                    />
                    <span className="flex-1 min-w-0">
                      <span className={`text-sm block ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground leading-relaxed mt-0.5 block">
                          {item.description}
                        </span>
                      )}
                      {item.links && item.links.length > 0 && (
                        <span className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.links.map((link) => (
                            <LinkChip key={link.url + link.label} link={link} />
                          ))}
                        </span>
                      )}
                    </span>
                  </label>

                  {/* Test button */}
                  {hasSql && onTest && (
                    <div className="shrink-0 flex flex-col items-end gap-0.5 mt-0.5">
                      <button
                        onClick={() => onTest(phase.key, item.key)}
                        disabled={status === "running"}
                        title="Run verified test query"
                        className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                          status === "pass"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : status === "fail"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : status === "no_employee"
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-muted text-muted-foreground border border-border hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                        }`}
                      >
                        <FlaskConical size={9} />
                        {status === "running"      ? "Testing…"
                         : status === "pass"       ? "Test result: Pass"
                         : status === "fail"       ? "Test result: Fail"
                         : status === "no_employee" ? "Test result: Pass"
                         : "Test"}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function LinkChip({ link }: { link: Link }) {
  const isSnowflake   = link.type === "snowflake"
  const isPlaceholder = link.url === "#" || link.url.startsWith("#")

  if (isSnowflake) {
    const tableRef = link.url.startsWith("#sf:") ? link.url.slice(4) : link.label
    const shortLabel = link.label.split(".").pop() ?? link.label
    return (
      <span
        title={`Snowflake table: ${tableRef}`}
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 cursor-default"
      >
        <Database size={10} />
        {shortLabel}
      </span>
    )
  }

  if (isPlaceholder) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300 cursor-default">
        <BookOpen size={10} />
        {link.label}
      </span>
    )
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-colors"
    >
      <ExternalLink size={10} />
      {link.label}
    </a>
  )
}
