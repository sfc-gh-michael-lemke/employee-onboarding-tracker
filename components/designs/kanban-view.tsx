"use client"

import { useState, useRef } from "react"
import type { Employee } from "@/app/page"
import type { ViewProps } from "@/components/onboarding-app"
import { EmployeeDrawer } from "@/components/employee-drawer"
import { CheckCircle2, Clock, UserPlus, GripVertical } from "lucide-react"
import type { Phase } from "@/lib/phases"

export function KanbanView({ employees, selectedId, onSelect, onToggleCheck, onDelete, onSaveNotes, onAddClick, phases, boardId, objectSingular = "Employee", objectPlural = "Employees", objectIcon = "👤" }: ViewProps) {
  const [drawerId, setDrawerId]     = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState<string | null>(null)
  const [dragging, setDragging]     = useState<string | null>(null)
  const [advancing, setAdvancing]   = useState<string | null>(null)
  const dragEmpRef = useRef<string | null>(null)

  const PHASE_LABELS = Object.fromEntries(phases.map((p) => [p.key, p.label]))
  const ALL_COLUMNS = [...phases.map((p) => p.key), "done"]
  const COL_LABEL: Record<string, string> = { ...PHASE_LABELS, done: "Done ✓" }
  const PHASE_INDEX = Object.fromEntries(phases.map((p, i) => [p.key, i]))
  const TOTAL_ITEMS = phases.reduce((sum, p) => sum + p.items.length, 0)

  const byPhase: Record<string, Employee[]> = {}
  for (const col of ALL_COLUMNS) byPhase[col] = []
  for (const emp of employees) {
    const col = emp.currentPhase in byPhase ? emp.currentPhase : "done"
    byPhase[col].push(emp)
  }

  const drawerEmp = employees.find((e) => e.ID === drawerId) ?? null

  async function handleDrop(targetPhaseKey: string) {
    const empId = dragEmpRef.current
    if (!empId) return
    setDragOver(null)
    setDragging(null)

    const emp = employees.find((e) => e.ID === empId)
    if (!emp) return

    const targetIdx = targetPhaseKey === "done" ? phases.length : (PHASE_INDEX[targetPhaseKey] ?? 0)
    const currentIdx = emp.currentPhase === "done" ? phases.length : (PHASE_INDEX[emp.currentPhase] ?? 0)

    if (targetIdx <= currentIdx) return

    setAdvancing(empId)

    const phasesToCheck = phases.slice(0, targetIdx)
    for (const phase of phasesToCheck) {
      for (const item of phase.items) {
        const alreadyChecked = emp.checklist[phase.key]?.[item.key]
        if (!alreadyChecked) {
          onToggleCheck(empId, phase.key, item.key, true)
          await new Promise((r) => setTimeout(r, 30))
        }
      }
    }

    setAdvancing(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {employees.length} {employees.length !== 1 ? objectPlural.toLowerCase() : objectSingular.toLowerCase()} on board
          </span>
          <span className="text-xs text-muted-foreground italic hidden sm:inline">
            Drag a card to advance to a later phase
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={13} /> Add {objectSingular}
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full px-4 py-3" style={{ minWidth: `${ALL_COLUMNS.length * 220}px` }}>
          {ALL_COLUMNS.map((colKey) => {
            const cards   = byPhase[colKey] ?? []
            const isDoneCol = colKey === "done"
            const isTarget  = dragOver === colKey

            const dragEmp = employees.find((e) => e.ID === dragging)
            const dragIdx = dragEmp
              ? (dragEmp.currentPhase === "done" ? phases.length : (PHASE_INDEX[dragEmp.currentPhase] ?? 0))
              : -1
            const colIdx = colKey === "done" ? phases.length : (PHASE_INDEX[colKey] ?? 0)
            const isValidTarget = dragging !== null && colIdx > dragIdx

            return (
              <div
                key={colKey}
                className="flex flex-col w-52 shrink-0"
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(colKey)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null)
                }}
                onDrop={() => handleDrop(colKey)}
              >
                {/* Column header */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-t-lg text-xs font-semibold mb-1 transition-colors ${
                    isTarget && isValidTarget
                      ? "bg-primary/10 border-2 border-primary border-dashed text-primary"
                      : isTarget && !isValidTarget
                      ? "bg-destructive/10 border-2 border-destructive/30 border-dashed text-destructive"
                      : isDoneCol
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span>{isTarget && isValidTarget ? `→ ${COL_LABEL[colKey]}` : COL_LABEL[colKey]}</span>
                  <span className="bg-background text-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-border">
                    {cards.length}
                  </span>
                </div>

                {isTarget && isValidTarget && (
                  <div className="mx-1 mb-1 border-2 border-dashed border-primary/40 rounded-lg bg-primary/5 flex items-center justify-center py-2 text-[10px] text-primary font-medium">
                    Drop to advance here
                  </div>
                )}
                {isTarget && !isValidTarget && dragging && (
                  <div className="mx-1 mb-1 border-2 border-dashed border-destructive/30 rounded-lg bg-destructive/5 flex items-center justify-center py-2 text-[10px] text-destructive font-medium">
                    Can&apos;t move backward
                  </div>
                )}

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
                        isAdvancing={advancing === emp.ID}
                        isDragging={dragging === emp.ID}
                        phases={phases}
                        totalItems={TOTAL_ITEMS}
                        colLabel={COL_LABEL}
                        onClick={() => { onSelect(emp.ID); setDrawerId(emp.ID) }}
                        onDragStart={() => {
                          setDragging(emp.ID)
                          dragEmpRef.current = emp.ID
                        }}
                        onDragEnd={() => {
                          setDragging(null)
                          setDragOver(null)
                          dragEmpRef.current = null
                        }}
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
          phases={phases}
          boardId={boardId}
        />
      )}
    </div>
  )
}

interface CardProps {
  employee: Employee
  isSelected: boolean
  isAdvancing: boolean
  isDragging: boolean
  phases: Phase[]
  totalItems: number
  colLabel: Record<string, string>
  onClick: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

function EmployeeCard({ employee, isSelected, isAdvancing, isDragging, phases, totalItems, colLabel, onClick, onDragStart, onDragEnd }: CardProps) {
  const phase        = phases.find((p) => p.key === employee.currentPhase)
  const phaseItems   = phase?.items.length ?? 0
  const checkedInPhase = phase ? Object.values(employee.checklist[phase.key] ?? {}).filter(Boolean).length : 0
  const pct          = totalItems > 0 ? Math.round((employee.checkedCount / totalItems) * 100) : 0
  const isDone       = employee.currentPhase === "done"

  return (
    <div
      draggable={!isDone}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`relative group bg-card border rounded-lg shadow-sm transition-all select-none ${
        isDragging
          ? "opacity-40 scale-95 shadow-none"
          : isAdvancing
          ? "border-primary ring-2 ring-primary/20 animate-pulse"
          : isSelected
          ? "border-primary ring-1 ring-primary/20"
          : "border-border hover:border-primary/30 hover:shadow-md"
      } ${!isDone ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {!isDone && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
          <GripVertical size={12} className="text-muted-foreground" />
        </div>
      )}

      <button onClick={onClick} className="w-full text-left px-3 py-3">
        {isAdvancing && (
          <div className="text-[10px] text-primary font-medium mb-1.5 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-bounce" />
            Advancing…
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-sm font-medium leading-tight truncate pl-2">{employee.FULL_NAME}</span>
          {isDone ? (
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <Clock size={14} className="text-muted-foreground shrink-0 mt-0.5" />
          )}
        </div>
        {employee.TITLE && <p className="text-xs text-muted-foreground truncate mb-2 pl-2">{employee.TITLE}</p>}

        {!isDone && phase && (
          <div className="text-[10px] text-muted-foreground mb-2 pl-2">
            {colLabel[employee.currentPhase]}: {checkedInPhase}/{phaseItems}
          </div>
        )}

        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 pl-2">
          <span className="text-[10px] text-muted-foreground">{pct}% overall</span>
          {employee.START_DATE && (
            <span className="text-[10px] text-muted-foreground">{formatDate(employee.START_DATE)}</span>
          )}
        </div>
      </button>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
