"use client"

import { useState, useEffect, useCallback } from "react"
import type { Employee } from "@/app/page"
import type { ViewProps } from "@/components/onboarding-app"
import { PHASES, TOTAL_ITEMS } from "@/lib/phases"
import { PhaseSection } from "@/components/phase-section"
import { X, Trash2, CheckCircle2, FlaskConical } from "lucide-react"

interface DrawerProps extends Pick<ViewProps, "onToggleCheck" | "onDelete" | "onSaveNotes"> {
  employee: Employee | null
  onClose: () => void
}

type TestStatus = "idle" | "running" | "pass" | "fail" | "no_employee"

const PHASE_LABELS: Record<string, string> = Object.fromEntries(PHASES.map((p) => [p.key, p.label]))
PHASE_LABELS["done"] = "Done"

export function EmployeeDrawer({ employee, onClose, onToggleCheck, onDelete, onSaveNotes }: DrawerProps) {
  const [notes, setNotes]           = useState(employee?.NOTES ?? "")
  const [saving, setSaving]         = useState(false)
  const [empEmail, setEmpEmail]     = useState(employee?.EMAIL ?? "")
  const [editingEmail, setEditingEmail] = useState(false)
  const [savingEmail, setSavingEmail]   = useState(false)
  const [queries, setQueries]       = useState<Record<string, string>>({})  // "phaseKey/itemKey" → sql
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({})
  const [testingAll, setTestingAll] = useState(false)

  useEffect(() => {
    setNotes(employee?.NOTES ?? "")
    setEmpEmail(employee?.EMAIL ?? "")
  }, [employee?.ID, employee?.NOTES])

  // Load verified queries from /api/phases once
  useEffect(() => {
    fetch("/api/phases")
      .then(r => r.json())
      .then((phases: any[]) => {
        const map: Record<string, string> = {}
        for (const phase of phases) {
          for (const item of phase.items) {
            if (item.verifiedTestQuery) map[`${phase.key}/${item.key}`] = item.verifiedTestQuery
          }
        }
        setQueries(map)
      })
      .catch(() => {})
  }, [])

  const saveEmail = useCallback(async (newEmail: string) => {
    if (!employee) return
    setSavingEmail(true)
    try {
      await fetch(`/api/employees/${employee.ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      })
      setEmpEmail(newEmail)
    } finally {
      setSavingEmail(false)
      setEditingEmail(false)
    }
  }, [employee])

  const testItem = useCallback(async (phaseKey: string, itemKey: string) => {
    const key = `${phaseKey}/${itemKey}`
    const sql = queries[key]
    const email = empEmail || employee?.EMAIL
    if (!sql || !email) {
      setTestStatus(s => ({ ...s, [key]: "no_employee" }))
      return
    }

    setTestStatus(s => ({ ...s, [key]: "running" }))
    try {
      const res  = await fetch("/api/run-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, email }),
      })
      const data = await res.json()

      if (data.count > 0) {
        const checkRes  = await fetch("/api/auto-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phase_key: phaseKey, item_key: itemKey }),
        })
        const checkData = await checkRes.json()
        if (checkData.reason === "no_employee") {
          setTestStatus(s => ({ ...s, [key]: "no_employee" }))
        } else {
          setTestStatus(s => ({ ...s, [key]: "pass" }))
          if (employee) onToggleCheck(employee.ID, phaseKey, itemKey, true)
        }
      } else {
        setTestStatus(s => ({ ...s, [key]: "fail" }))
      }
    } catch {
      setTestStatus(s => ({ ...s, [key]: "fail" }))
    }
  }, [queries, employee, onToggleCheck])

  const testAll = useCallback(async () => {
    setTestingAll(true)
    setTestStatus({})
    const pairs: [string, string][] = []
    for (const phase of PHASES) {
      for (const item of phase.items) {
        if (queries[`${phase.key}/${item.key}`]) pairs.push([phase.key, item.key])
      }
    }
    // Run in parallel batches of 4
    for (let i = 0; i < pairs.length; i += 4) {
      await Promise.all(pairs.slice(i, i + 4).map(([pk, ik]) => testItem(pk, ik)))
    }
    setTestingAll(false)
  }, [queries, testItem])

  if (!employee) return null

  const checkedCount = employee.checkedCount
  const progressPct  = Math.round((checkedCount / TOTAL_ITEMS) * 100)
  const hasQueries   = Object.keys(queries).length > 0

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-[480px] max-w-full bg-card border-l border-border shadow-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold leading-tight">{employee.FULL_NAME}</h2>
            {employee.TITLE && <p className="text-sm text-muted-foreground mt-0.5">{employee.TITLE}</p>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {hasQueries && (
              <button
                onClick={testAll}
                disabled={testingAll}
                title="Run all verified tests"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FlaskConical size={12} />
                {testingAll ? "Testing…" : "Test All"}
              </button>
            )}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-muted/40 rounded-lg">
            <Detail label="Manager"    value={employee.MANAGER} />
            <Detail label="Territory"  value={employee.TERRITORY} />
            <Detail label="Start Date" value={employee.START_DATE ? formatDate(employee.START_DATE) : undefined} />
            <Detail label="Phase"      value={PHASE_LABELS[employee.currentPhase] ?? employee.currentPhase} />
          </div>

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

          <div className="space-y-2">
            {PHASES.map((phase, idx) => {
              const phaseChecklist = employee.checklist[phase.key] ?? {}
              const checked  = phase.items.filter((i) => phaseChecklist[i.key]).length
              const isActive = employee.currentPhase === phase.key
              const isDone   = checked === phase.items.length
              const isLocked = !isDone && !isActive && idx > PHASES.findIndex((p) => p.key === employee.currentPhase)
              return (
                <PhaseSection
                  key={phase.key}
                  phase={phase}
                  checklist={phaseChecklist}
                  isActive={isActive}
                  isDone={isDone}
                  isLocked={isLocked}
                  queries={queries}
                  testStatus={testStatus}
                  onToggle={(phaseKey, itemKey, isChecked) => onToggleCheck(employee.ID, phaseKey, itemKey, isChecked)}
                  onTest={testItem}
                />
              )
            })}
          </div>

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
              onClick={async () => { setSaving(true); await onSaveNotes(employee.ID, notes); setSaving(false) }}
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
