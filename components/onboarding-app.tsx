"use client"

import { useState, useEffect, useCallback } from "react"
import type { Employee } from "@/app/page"
import { getCurrentPhase } from "@/lib/phases"
import { AddEmployeeDialog } from "@/components/add-employee-dialog"
import { KanbanView } from "@/components/designs/kanban-view"
import { DashboardView } from "@/components/designs/dashboard-view"
import { StepperView } from "@/components/designs/stepper-view"
import { LayoutGrid, LayoutList, GitBranch } from "lucide-react"

type Design = "kanban" | "dashboard" | "stepper"

export interface ViewProps {
  employees: Employee[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleCheck: (empId: string, phaseKey: string, itemKey: string, isChecked: boolean) => void
  onDelete: (id: string) => void
  onSaveNotes: (id: string, notes: string) => Promise<void>
  onAddClick: () => void
}

const DESIGNS: { key: Design; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "kanban", label: "Kanban", Icon: LayoutGrid },
  { key: "dashboard", label: "Dashboard", Icon: LayoutList },
  { key: "stepper", label: "Stepper", Icon: GitBranch },
]

export function OnboardingApp({
  initialEmployees,
  initialError,
  boardId,
  boardName,
}: {
  initialEmployees: Employee[]
  initialError: string | null
  boardId?: string
  boardName?: string
}) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [selectedId, setSelectedId] = useState<string | null>(initialEmployees[0]?.ID ?? null)
  const [showAdd, setShowAdd] = useState(false)
  const [design, setDesign] = useState<Design>("kanban")

  // Poll for checklist updates (e.g. auto-checks from /phases)
  const refresh = useCallback(async () => {
    try {
      const url = boardId ? `/api/employees?board_id=${boardId}` : "/api/employees"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEmployees(data)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [refresh])

  const handleToggleCheck = (empId: string, phaseKey: string, itemKey: string, isChecked: boolean) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.ID !== empId) return emp
        const newChecklist = {
          ...emp.checklist,
          [phaseKey]: { ...(emp.checklist[phaseKey] ?? {}), [itemKey]: isChecked },
        }
        const checkedCount = Object.values(newChecklist).reduce(
          (sum, phase) => sum + Object.values(phase).filter(Boolean).length,
          0
        )
        return { ...emp, checklist: newChecklist, checkedCount, currentPhase: getCurrentPhase(newChecklist) }
      })
    )
    fetch(`/api/employees/${empId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phaseKey, itemKey, isChecked }),
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Remove this employee from onboarding?")) return
    fetch(`/api/employees/${id}`, { method: "DELETE" })
    setEmployees((prev) => prev.filter((e) => e.ID !== id))
    if (selectedId === id) {
      setSelectedId(employees.find((e) => e.ID !== id)?.ID ?? null)
    }
  }

  const handleSaveNotes = async (id: string, notes: string) => {
    await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    })
    setEmployees((prev) => prev.map((e) => (e.ID === id ? { ...e, NOTES: notes } : e)))
  }

  const handleAddEmployee = async (data: {
    fullName: string; title: string; startDate: string
    manager: string; territory: string; notes: string
  }) => {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: data.fullName, title: data.title, startDate: data.startDate,
        manager: data.manager, territory: data.territory, notes: data.notes,
        boardId,
      }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const newEmp = await res.json()
    setEmployees((prev) => [newEmp, ...prev])
    setSelectedId(newEmp.ID)
    setShowAdd(false)
  }

  const viewProps: ViewProps = {
    employees,
    selectedId,
    onSelect: setSelectedId,
    onToggleCheck: handleToggleCheck,
    onDelete: handleDelete,
    onSaveNotes: handleSaveNotes,
    onAddClick: () => setShowAdd(true),
  }

  if (initialError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg">{initialError}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Design switcher bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        {boardName && (
          <span className="text-xs font-semibold text-foreground mr-3">{boardName}</span>
        )}
        <span className="text-xs text-muted-foreground mr-2">Layout:</span>
        {DESIGNS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setDesign(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              design === key
                ? "bg-background border border-border text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {design === "kanban" && <KanbanView {...viewProps} />}
        {design === "dashboard" && <DashboardView {...viewProps} />}
        {design === "stepper" && <StepperView {...viewProps} />}
      </div>

      {showAdd && <AddEmployeeDialog onClose={() => setShowAdd(false)} onSubmit={handleAddEmployee} />}
    </div>
  )
}
