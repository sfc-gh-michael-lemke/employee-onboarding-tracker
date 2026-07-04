"use client"

import { useState } from "react"
import type { Employee } from "@/app/page"
import type { ViewProps } from "@/components/onboarding-app"
import { PHASES, TOTAL_ITEMS } from "@/lib/phases"
import { EmployeeDrawer } from "@/components/employee-drawer"
import { CheckCircle2, Clock, UserPlus } from "lucide-react"

const PHASE_LABELS = Object.fromEntries(PHASES.map((p) => [p.key, p.label]))
const ALL_COLUMNS = [...PHASES.map((p) => p.key), "done"]
const COL_LABEL: Record<string, string> = { ...PHASE_LABELS, done: "Done ✓" }

export function KanbanView({ employees, selectedId, onSelect, onToggleCheck, onDelete, onSaveNotes, onAddClick }: ViewProps) {
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const byPhase: Record<string, Employee[]> = {}
  for (const col of ALL_COLUMNS) byPhase[col] = []
  for (const emp of employees) {
    const col = emp.currentPhase in byPhase ? emp.currentPhase : "done"
    byPhase[col].push(emp)
  }

  const drawerEmp = employees.find((e) => e.ID === drawerId) ?? null

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <span className="text-sm font-medium text-foreground">
          {employees.length} employee{employees.length !== 1 ? "s" : ""} in onboarding
        </span>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={13} /> Add New Hire
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full px-4 py-3" style={{ minWidth: `${ALL_COLUMNS.length * 220}px` }}>
          {ALL_COLUMNS.map((colKey) => {
            const cards = byPhase[colKey] ?? []
            const isDoneCol = colKey === "done"
            return (
              <div key={colKey} className="flex flex-col w-52 shrink-0">
                {/* Column header */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-t-lg text-xs font-semibold mb-1 ${
                    isDoneCol
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span>{COL_LABEL[colKey]}</span>
                  <span className="bg-background text-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-border">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 pb-2">
                  {cards.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-lg h-16 flex items-center justify-center text-xs text-muted-foreground/50">
                      Empty
                    </div>
                  ) : (
                    cards.map((emp) => (
                      <EmployeeCard
                        key={emp.ID}
                        employee={emp}
                        isSelected={emp.ID === selectedId}
                        onClick={() => { onSelect(emp.ID); setDrawerId(emp.ID) }}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {drawerId && (
        <EmployeeDrawer
          employee={drawerEmp}
          onClose={() => setDrawerId(null)}
          onToggleCheck={onToggleCheck}
          onDelete={(id) => { onDelete(id); setDrawerId(null) }}
          onSaveNotes={onSaveNotes}
        />
      )}
    </div>
  )
}

function EmployeeCard({ employee, isSelected, onClick }: { employee: Employee; isSelected: boolean; onClick: () => void }) {
  const phase = PHASES.find((p) => p.key === employee.currentPhase)
  const phaseItems = phase?.items.length ?? 0
  const checkedInPhase = phase ? Object.values(employee.checklist[phase.key] ?? {}).filter(Boolean).length : 0
  const pct = TOTAL_ITEMS > 0 ? Math.round((employee.checkedCount / TOTAL_ITEMS) * 100) : 0
  const isDone = employee.currentPhase === "done"

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card border rounded-lg px-3 py-3 shadow-sm hover:shadow-md transition-all ${
        isSelected ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium leading-tight truncate">{employee.FULL_NAME}</span>
        {isDone ? (
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <Clock size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        )}
      </div>
      {employee.TITLE && <p className="text-xs text-muted-foreground truncate mb-2">{employee.TITLE}</p>}

      {/* Phase progress within current phase */}
      {!isDone && phase && (
        <div className="text-[10px] text-muted-foreground mb-2">
          {COL_LABEL[employee.currentPhase]}: {checkedInPhase}/{phaseItems}
        </div>
      )}

      {/* Overall progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isDone ? "bg-emerald-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">{pct}% overall</span>
        {employee.START_DATE && (
          <span className="text-[10px] text-muted-foreground">{formatDate(employee.START_DATE)}</span>
        )}
      </div>
    </button>
  )
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
