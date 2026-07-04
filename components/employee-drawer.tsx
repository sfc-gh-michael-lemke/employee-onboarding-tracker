"use client"

import { useState, useEffect } from "react"
import type { Employee } from "@/app/page"
import type { ViewProps } from "@/components/onboarding-app"
import { PHASES, TOTAL_ITEMS } from "@/lib/phases"
import { PhaseSection } from "@/components/phase-section"
import { X, Trash2, CheckCircle2 } from "lucide-react"

interface DrawerProps extends Pick<ViewProps, "onToggleCheck" | "onDelete" | "onSaveNotes"> {
  employee: Employee | null
  onClose: () => void
}

const PHASE_LABELS: Record<string, string> = Object.fromEntries(PHASES.map((p) => [p.key, p.label]))
PHASE_LABELS["done"] = "Done"

export function EmployeeDrawer({ employee, onClose, onToggleCheck, onDelete, onSaveNotes }: DrawerProps) {
  const [notes, setNotes] = useState(employee?.NOTES ?? "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNotes(employee?.NOTES ?? "")
  }, [employee?.ID, employee?.NOTES])

  if (!employee) return null

  const checkedCount = employee.checkedCount
  const progressPct = Math.round((checkedCount / TOTAL_ITEMS) * 100)

  const handleSave = async () => {
    setSaving(true)
    await onSaveNotes(employee.ID, notes)
    setSaving(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-[480px] max-w-full bg-card border-l border-border shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold leading-tight">{employee.FULL_NAME}</h2>
            {employee.TITLE && <p className="text-sm text-muted-foreground mt-0.5">{employee.TITLE}</p>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => { onDelete(employee.ID); onClose() }}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
              title="Remove"
            >
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-muted/40 rounded-lg">
            <Detail label="Manager" value={employee.MANAGER} />
            <Detail label="Territory" value={employee.TERRITORY} />
            <Detail label="Start Date" value={employee.START_DATE ? formatDate(employee.START_DATE) : undefined} />
            <Detail label="Phase" value={PHASE_LABELS[employee.currentPhase] ?? employee.currentPhase} />
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span>{checkedCount}/{TOTAL_ITEMS} · {progressPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            {employee.currentPhase === "done" && (
              <p className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 size={13} /> Onboarding complete
              </p>
            )}
          </div>

          {/* Phases */}
          <div className="space-y-2">
            {PHASES.map((phase, idx) => {
              const phaseChecklist = employee.checklist[phase.key] ?? {}
              const checked = phase.items.filter((i) => phaseChecklist[i.key]).length
              const isActive = employee.currentPhase === phase.key
              const isDone = checked === phase.items.length
              const isLocked = !isDone && !isActive && idx > PHASES.findIndex((p) => p.key === employee.currentPhase)
              return (
                <PhaseSection
                  key={phase.key}
                  phase={phase}
                  checklist={phaseChecklist}
                  isActive={isActive}
                  isDone={isDone}
                  isLocked={isLocked}
                  onToggle={(phaseKey, itemKey, isChecked) =>
                    onToggleCheck(employee.ID, phaseKey, itemKey, isChecked)
                  }
                />
              )
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes…"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleSave}
              disabled={saving || notes === employee.NOTES}
              className="mt-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save notes"}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value ?? <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
