"use client"

import { useState } from "react"
import type { Employee } from "@/app/page"
import type { ViewProps } from "@/components/onboarding-app"
import { PHASES, TOTAL_ITEMS } from "@/lib/phases"
import { EmployeeDrawer } from "@/components/employee-drawer"
import { UserPlus, ChevronUp, ChevronDown, CheckCircle2, Clock, Users, TrendingUp, Award } from "lucide-react"

type SortKey = "FULL_NAME" | "START_DATE" | "currentPhase" | "checkedCount"

const PHASE_ORDER = Object.fromEntries([...PHASES.map((p, i) => [p.key, i]), ["done", PHASES.length]])
const PHASE_LABELS = Object.fromEntries(PHASES.map((p) => [p.key, p.label]))
PHASE_LABELS["done"] = "Done"

export function DashboardView({ employees, onToggleCheck, onDelete, onSaveNotes, onAddClick }: ViewProps) {
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("START_DATE")
  const [sortAsc, setSortAsc] = useState(true)

  const drawerEmp = employees.find((e) => e.ID === drawerId) ?? null

  const inProgress = employees.filter((e) => e.currentPhase !== "done").length
  const done = employees.filter((e) => e.currentPhase === "done").length
  const avgPct =
    employees.length > 0
      ? Math.round(employees.reduce((s, e) => s + (e.checkedCount / TOTAL_ITEMS) * 100, 0) / employees.length)
      : 0

  const sorted = [...employees].sort((a, b) => {
    let av: string | number, bv: string | number
    if (sortKey === "checkedCount") {
      av = a.checkedCount; bv = b.checkedCount
    } else if (sortKey === "currentPhase") {
      av = PHASE_ORDER[a.currentPhase] ?? 0
      bv = PHASE_ORDER[b.currentPhase] ?? 0
    } else {
      av = (a[sortKey] ?? "").toString()
      bv = (b[sortKey] ?? "").toString()
    }
    if (av < bv) return sortAsc ? -1 : 1
    if (av > bv) return sortAsc ? 1 : -1
    return 0
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border shrink-0">
        <KpiCard icon={<Users size={18} className="text-primary" />} label="Total New Hires" value={employees.length} />
        <KpiCard icon={<Clock size={18} className="text-amber-500" />} label="In Progress" value={inProgress} />
        <KpiCard icon={<CheckCircle2 size={18} className="text-emerald-500" />} label="Complete" value={done} />
        <KpiCard icon={<TrendingUp size={18} className="text-blue-500" />} label="Avg Completion" value={`${avgPct}%`} />
      </div>

      {/* Table toolbar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-border shrink-0">
        <span className="text-sm font-medium">All Employees</span>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={13} /> Add New Hire
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr>
              <SortTh label="Name" sortKey="FULL_NAME" current={sortKey} asc={sortAsc} onSort={handleSort} />
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Title</th>
              <SortTh label="Start Date" sortKey="START_DATE" current={sortKey} asc={sortAsc} onSort={handleSort} />
              <SortTh label="Phase" sortKey="currentPhase" current={sortKey} asc={sortAsc} onSort={handleSort} />
              <SortTh label="Progress" sortKey="checkedCount" current={sortKey} asc={sortAsc} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                  No employees yet. Click "Add New Hire" to get started.
                </td>
              </tr>
            ) : (
              sorted.map((emp) => {
                const pct = Math.round((emp.checkedCount / TOTAL_ITEMS) * 100)
                const isDone = emp.currentPhase === "done"
                return (
                  <tr
                    key={emp.ID}
                    onClick={() => setDrawerId(emp.ID)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{emp.FULL_NAME}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{emp.TITLE ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {emp.START_DATE ? formatDate(emp.START_DATE) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          isDone
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isDone ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {PHASE_LABELS[emp.currentPhase] ?? emp.currentPhase}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isDone ? "bg-emerald-500" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function SortTh({
  label, sortKey, current, asc, onSort,
}: {
  label: string; sortKey: SortKey; current: SortKey; asc: boolean; onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th className="px-4 py-2.5 text-left">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {label}
        {active ? (
          asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronDown size={12} className="opacity-30" />
        )}
      </button>
    </th>
  )
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
