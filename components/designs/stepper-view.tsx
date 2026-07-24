"use client"

import { useState, useEffect } from "react"
import type { Employee } from "@/app/page"
import type { ViewProps } from "@/components/onboarding-app"
import { PhaseSection } from "@/components/phase-section"
import { EmployeeDrawer } from "@/components/employee-drawer"
import { CheckCircle2, UserPlus, ChevronLeft, ChevronRight, Trash2, Upload } from "lucide-react"

export function StepperView({ employees, selectedId, onSelect, onToggleCheck, onDelete, onSaveNotes, onAddClick, onBulkImportClick, phases, boardId, objectSingular = "Employee", objectPlural = "Employees" }: ViewProps) {
  const [focusedPhaseIdx, setFocusedPhaseIdx] = useState(0)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const PHASE_LABELS: Record<string, string> = Object.fromEntries([...phases.map((p) => [p.key, p.label]), ["done", "Done"]])
  const TOTAL_ITEMS = phases.reduce((sum, p) => sum + p.items.length, 0)

  const selected = employees.find((e) => e.ID === selectedId) ?? null
  const drawerEmp = employees.find((e) => e.ID === drawerId) ?? null
  const activeIdx = selected ? phases.findIndex((p) => p.key === selected.currentPhase) : 0
  const effectiveIdx = selected?.currentPhase === "done" ? phases.length - 1 : activeIdx

  useEffect(() => {
    setFocusedPhaseIdx(effectiveIdx >= 0 ? effectiveIdx : 0)
    setNotes(selected?.NOTES ?? "")
  }, [selectedId])

  const focusedPhase = phases[focusedPhaseIdx]
  const checkedCount = selected?.checkedCount ?? 0
  const pct = TOTAL_ITEMS > 0 ? Math.round((checkedCount / TOTAL_ITEMS) * 100) : 0

  const handleSaveNotes = async () => {
    if (!selected) return
    setSaving(true)
    await onSaveNotes(selected.ID, notes)
    setSaving(false)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — employee list */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {objectPlural} ({employees.length})
          </span>
          <div className="flex items-center gap-1">
            <button onClick={onBulkImportClick} className="text-muted-foreground hover:text-primary" title={`Import ${objectPlural}`}>
              <Upload size={13} />
            </button>
            <button onClick={onAddClick} className="text-primary hover:text-primary/80" title={`Add ${objectSingular}`}>
              <UserPlus size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {employees.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center">No {objectPlural.toLowerCase()} yet.</div>
          ) : (
            employees.map((emp) => {
              const isDone = emp.currentPhase === "done"
              const empPct = TOTAL_ITEMS > 0 ? Math.round((emp.checkedCount / TOTAL_ITEMS) * 100) : 0
              return (
                <button
                  key={emp.ID}
                  onClick={() => onSelect(emp.ID)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border transition-colors ${
                    emp.ID === selectedId ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-sm font-medium truncate">{emp.FULL_NAME}</span>
                    {isDone && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDone ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${empPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{empPct}%</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Right — stepper + detail */}
      <main className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Select a {objectSingular.toLowerCase()} to view their progress.
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-5">
            {/* Employee header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-xl font-semibold">{selected.FULL_NAME}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {selected.TITLE && <span>{selected.TITLE}</span>}
                  {selected.MANAGER && <span>· {selected.MANAGER}</span>}
                  {selected.START_DATE && <span>· {formatDate(selected.START_DATE)}</span>}
                </div>
              </div>
              <button
                onClick={() => onDelete(selected.ID)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="mb-6">
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {phases.map((phase, idx) => {
                  const phaseChecklist = selected.checklist[phase.key] ?? {}
                  const isDone = phase.items.length > 0 && phase.items.every((i) => phaseChecklist[i.key])
                  const isActive = selected.currentPhase === phase.key
                  const isFocused = focusedPhaseIdx === idx

                  return (
                    <div key={phase.key} className="flex items-center shrink-0">
                      <button
                        onClick={() => setFocusedPhaseIdx(idx)}
                        className={`flex flex-col items-center gap-1 px-2 py-1 rounded transition-colors ${
                          isFocused ? "bg-primary/10" : "hover:bg-muted/60"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                            isDone
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : isActive
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background border-border text-muted-foreground"
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <span className={`text-[9px] font-medium leading-none text-center w-12 ${isFocused ? "text-primary" : "text-muted-foreground"}`}>
                          {phase.label.replace(" ", "\n")}
                        </span>
                      </button>
                      {idx < phases.length - 1 && (
                        <div className={`w-4 h-0.5 ${
                          phases.slice(0, idx + 1).every((p) => p.items.every((i) => (selected.checklist[p.key] ?? {})[i.key]))
                            ? "bg-emerald-400"
                            : "bg-border"
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Overall progress */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{checkedCount}/{TOTAL_ITEMS} · {pct}%</span>
              </div>
            </div>

            {/* Focused phase card */}
            {focusedPhase && (
              <div className="border border-border rounded-xl overflow-hidden mb-5">
                {/* Phase card header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                  <div>
                    <h2 className="text-sm font-semibold">{focusedPhase.label}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{focusedPhase.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFocusedPhaseIdx((i) => Math.max(0, i - 1))}
                      disabled={focusedPhaseIdx === 0}
                      className="p-1 rounded hover:bg-muted/60 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-xs text-muted-foreground px-1">{focusedPhaseIdx + 1}/{phases.length}</span>
                    <button
                      onClick={() => setFocusedPhaseIdx((i) => Math.min(phases.length - 1, i + 1))}
                      disabled={focusedPhaseIdx === phases.length - 1}
                      className="p-1 rounded hover:bg-muted/60 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Phase links */}
                {focusedPhase.links && focusedPhase.links.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-border bg-background">
                    {focusedPhase.links.map((link) => {
                      const isSnowflake = link.type === "snowflake"
                      const isPlaceholder = link.url === "#" || link.url.startsWith("#")
                      if (isSnowflake) return (
                        <span key={link.url} title={link.url.slice(4)} className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                          🗄 {link.label.split(".").slice(-2).join(".")}
                        </span>
                      )
                      if (isPlaceholder) return (
                        <span key={link.url} className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {link.label}
                        </span>
                      )
                      return (
                        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-colors">
                          ↗ {link.label}
                        </a>
                      )
                    })}
                  </div>
                )}

                {/* Checklist items */}
                <ul className="divide-y divide-border">
                  {focusedPhase.items.map((item) => {
                    const isChecked = (selected.checklist[focusedPhase.key] ?? {})[item.key] ?? false
                    return (
                      <li key={item.key} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => onToggleCheck(selected.ID, focusedPhase.key, item.key, e.target.checked)}
                            className="h-4 w-4 mt-0.5 rounded border-border accent-primary cursor-pointer shrink-0"
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
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this employee&apos;s onboarding…"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={handleSaveNotes}
                disabled={saving || notes === selected.NOTES}
                className="mt-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save notes"}
              </button>
            </div>
          </div>
        )}
      </main>

      {drawerId && (
        <EmployeeDrawer
          employee={drawerEmp}
          onClose={() => setDrawerId(null)}
          onToggleCheck={onToggleCheck}
          onDelete={(id) => { onDelete(id); setDrawerId(null) }}
          onSaveNotes={onSaveNotes}
          phases={phases}
          boardId={boardId}
        />
      )}
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
