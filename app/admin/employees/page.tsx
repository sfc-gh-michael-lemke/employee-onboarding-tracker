"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { AddEmployeeDialog } from "@/components/add-employee-dialog"

interface Employee {
  ID: string
  FULL_NAME: string
  TITLE: string | null
  START_DATE: string | null
  MANAGER: string | null
  TERRITORY: string | null
  NOTES: string | null
  CUSTOM_DATA: Record<string, string> | null
}

type EditState = Partial<Omit<Employee, "ID" | "CUSTOM_DATA">> & {
  custom: Record<string, string>
}

interface ColDef {
  key: string
  label: string
  width: string
  type?: string
  isCustom?: boolean
}

const BUILT_IN_COLS: ColDef[] = [
  { key: "FULL_NAME",  label: "Name",       width: "w-44" },
  { key: "TITLE",      label: "Title",      width: "w-44" },
  { key: "START_DATE", label: "Start Date", width: "w-32", type: "date" },
  { key: "MANAGER",    label: "Manager",    width: "w-40" },
  { key: "TERRITORY",  label: "Territory",  width: "w-40" },
  { key: "NOTES",      label: "Notes",      width: "w-64" },
]

function slugify(s: string) {
  return "custom_" + s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32)
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState<string | null>(null)
  const [draft, setDraft]         = useState<EditState>({ custom: {} })
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [showAdd, setShowAdd]     = useState(false)

  // Board selector
  const [boards, setBoards]   = useState<Array<{ ID: string; NAME: string }>>([])
  const [boardId, setBoardId] = useState<string>("")

  // Column config — all lazily read from localStorage
  const [colOrder, setColOrder]       = useState<string[]>([])
  const [colVisible, setColVisible]   = useState<Record<string, boolean>>({})
  const [customCols, setCustomCols]   = useState<ColDef[]>([])
  const [colMgrOpen, setColMgrOpen]   = useState(false)

  // Initialise column config once on mount (localStorage not available during SSR)
  useEffect(() => {
    const defaultOrder = BUILT_IN_COLS.map(c => c.key)
    const storedOrder  = lsGet<string[]>("admin:colOrder", defaultOrder)
    const storedVis    = lsGet<Record<string, boolean>>("admin:colVisible", {})
    const storedCustom = lsGet<ColDef[]>("admin:customCols", [])
    setColOrder(storedOrder)
    setColVisible(storedVis)
    setCustomCols(storedCustom)
  }, [])

  const load = useCallback(async (bid?: string) => {
    setLoading(true)
    const url = bid ? `/api/employees?board_id=${bid}` : "/api/employees"
    const res = await fetch(url)
    const data = await res.json()
    setEmployees(data)
    setLoading(false)
  }, [])

  // Load boards on mount, auto-select first
  useEffect(() => {
    fetch("/api/boards")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBoards(data)
          setBoardId(data[0].ID)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => { if (boardId) load(boardId) }, [boardId, load])

  // Computed ordered + visible columns
  const allCols: ColDef[] = [
    ...BUILT_IN_COLS,
    ...customCols,
  ]

  // Ensure any new col keys that aren't in colOrder yet get appended
  const fullOrder = [
    ...colOrder,
    ...allCols.map(c => c.key).filter(k => !colOrder.includes(k)),
  ]

  const activeCols = fullOrder
    .map(k => allCols.find(c => c.key === k))
    .filter((c): c is ColDef => !!c && colVisible[c.key] !== false)

  function persistColOrder(o: string[]) {
    setColOrder(o)
    lsSet("admin:colOrder", o)
  }
  function persistColVisible(v: Record<string, boolean>) {
    setColVisible(v)
    lsSet("admin:colVisible", v)
  }
  function persistCustomCols(cols: ColDef[]) {
    setCustomCols(cols)
    lsSet("admin:customCols", cols)
  }

  function startEdit(emp: Employee) {
    setEditing(emp.ID)
    setDraft({
      FULL_NAME:  emp.FULL_NAME,
      TITLE:      emp.TITLE      ?? "",
      START_DATE: emp.START_DATE ?? "",
      MANAGER:    emp.MANAGER    ?? "",
      TERRITORY:  emp.TERRITORY  ?? "",
      NOTES:      emp.NOTES      ?? "",
      custom: emp.CUSTOM_DATA ? { ...emp.CUSTOM_DATA } : {},
    })
    setError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setDraft({ custom: {} })
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This will also remove all their checklist progress.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      setEmployees(prev => prev.filter(e => e.ID !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(null)
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {}
      for (const col of BUILT_IN_COLS) {
        const val = draft[col.key as keyof typeof draft] as string | undefined
        body[col.key.toLowerCase()] = val === "" ? null : (val ?? null)
      }
      if (Object.keys(draft.custom).length > 0 || customCols.length > 0) {
        body.custom_data = draft.custom
      }
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      setEmployees(prev =>
        prev.map(e => e.ID === id
          ? { ...e, ...(draft as Partial<Employee>), CUSTOM_DATA: draft.custom }
          : e
        )
      )
      setEditing(null)
      setSaved(id)
      setTimeout(() => setSaved(null), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  function getCellValue(emp: Employee, col: ColDef): string {
    if (col.isCustom) return emp.CUSTOM_DATA?.[col.key] ?? ""
    return (emp[col.key as keyof Employee] as string | null) ?? ""
  }

  async function handleAddEmployee(data: {
    fullName: string; title: string; startDate: string
    manager: string; territory: string; notes: string
  }) {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, boardId }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const newEmp = await res.json()
    setEmployees(prev => [newEmp, ...prev])
    setShowAdd(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading employees…
      </div>
    )
  }

  return (
    <main className="px-6 py-8 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employee Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees.length} employees · click a row to edit</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Board selector */}
          <select
            value={boardId}
            onChange={e => setBoardId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {boards.map(b => <option key={b.ID} value={b.ID}>{b.NAME}</option>)}
          </select>
          <button
            onClick={() => setShowAdd(true)}
            disabled={!boardId}
            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            + Add Employee
          </button>
          <button
            onClick={() => setColMgrOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">⊞</span> Columns
          </button>

        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {activeCols.map(c => (
                <th key={c.key} className={`${c.width} px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide`}>
                  {c.label}
                </th>
              ))}
              <th className="w-28 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map(emp => {
              const isEditing = editing === emp.ID
              const isSaved   = saved   === emp.ID

              return (
                <tr
                  key={emp.ID}
                  className={`group transition-colors ${
                    isEditing ? "bg-blue-50" : isSaved ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  {activeCols.map(col => {
                    const val = getCellValue(emp, col)
                    return (
                      <td key={col.key} className={`${col.width} px-4 py-2.5`}>
                        {isEditing ? (
                          col.key === "NOTES" ? (
                            <textarea
                              className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                              rows={2}
                              value={col.isCustom ? (draft.custom[col.key] ?? "") : ((draft[col.key as keyof typeof draft] as string) ?? "")}
                              onChange={e => col.isCustom
                                ? setDraft(d => ({ ...d, custom: { ...d.custom, [col.key]: e.target.value } }))
                                : setDraft(d => ({ ...d, [col.key]: e.target.value }))
                              }
                            />
                          ) : (
                            <input
                              type={col.type ?? "text"}
                              className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              value={col.isCustom ? (draft.custom[col.key] ?? "") : ((draft[col.key as keyof typeof draft] as string) ?? "")}
                              onChange={e => col.isCustom
                                ? setDraft(d => ({ ...d, custom: { ...d.custom, [col.key]: e.target.value } }))
                                : setDraft(d => ({ ...d, [col.key]: e.target.value }))
                              }
                            />
                          )
                        ) : (
                          <span className={`${!val ? "text-gray-300 italic" : "text-gray-800"}`}>
                            {val || "—"}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="w-28 px-4 py-2.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => saveEdit(emp.ID)}
                          disabled={saving}
                          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? "…" : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isSaved ? (
                      <span className="text-xs text-green-600 font-medium">Saved ✓</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(emp)}
                          className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp.ID, emp.FULL_NAME)}
                          disabled={deleting === emp.ID}
                          className="px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                          title="Delete employee"
                        >
                          {deleting === emp.ID ? "…" : "✕"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {colMgrOpen && (
        <ColumnManager
          builtInCols={BUILT_IN_COLS}
          customCols={customCols}
          colOrder={fullOrder}
          colVisible={colVisible}
          onOrderChange={persistColOrder}
          onVisibleChange={persistColVisible}
          onCustomColsChange={persistCustomCols}
          onClose={() => setColMgrOpen(false)}
        />
      )}

      {showAdd && (
        <AddEmployeeDialog
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddEmployee}
        />
      )}
    </main>
  )
}

// ─── Column Manager Modal ───────────────────────────────────────────────────

interface ColMgrProps {
  builtInCols: ColDef[]
  customCols: ColDef[]
  colOrder: string[]
  colVisible: Record<string, boolean>
  onOrderChange: (o: string[]) => void
  onVisibleChange: (v: Record<string, boolean>) => void
  onCustomColsChange: (cols: ColDef[]) => void
  onClose: () => void
}

function ColumnManager({
  builtInCols, customCols, colOrder, colVisible,
  onOrderChange, onVisibleChange, onCustomColsChange, onClose,
}: ColMgrProps) {
  const allCols = [...builtInCols, ...customCols]
  const ordered = colOrder
    .map(k => allCols.find(c => c.key === k))
    .filter((c): c is ColDef => !!c)

  const [newLabel, setNewLabel] = useState("")
  const [addError, setAddError] = useState("")
  const dragKey = useRef<string | null>(null)

  function toggleVisible(key: string) {
    onVisibleChange({ ...colVisible, [key]: colVisible[key] === false ? true : false })
  }

  function handleDragStart(key: string) {
    dragKey.current = key
  }

  function handleDrop(targetKey: string) {
    if (!dragKey.current || dragKey.current === targetKey) return
    const o = [...colOrder]
    const fromIdx = o.indexOf(dragKey.current)
    const toIdx   = o.indexOf(targetKey)
    if (fromIdx === -1 || toIdx === -1) return
    o.splice(fromIdx, 1)
    o.splice(toIdx, 0, dragKey.current)
    onOrderChange(o)
    dragKey.current = null
  }

  function addCustomCol() {
    const label = newLabel.trim()
    if (!label) { setAddError("Enter a column name"); return }
    const key = slugify(label)
    if ([...builtInCols, ...customCols].some(c => c.key === key)) {
      setAddError("A column with that name already exists"); return
    }
    const newCol: ColDef = { key, label, width: "w-40", isCustom: true }
    onCustomColsChange([...customCols, newCol])
    onOrderChange([...colOrder, key])
    setNewLabel("")
    setAddError("")
  }

  function removeCustomCol(key: string) {
    onCustomColsChange(customCols.filter(c => c.key !== key))
    onOrderChange(colOrder.filter(k => k !== key))
    const v = { ...colVisible }
    delete v[key]
    onVisibleChange(v)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 h-full w-80 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Manage Columns</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs text-gray-400 mb-3">Drag to reorder · click eye to show/hide</p>
          <ul className="space-y-1">
            {ordered.map(col => {
              const visible = colVisible[col.key] !== false
              return (
                <li
                  key={col.key}
                  draggable
                  onDragStart={() => handleDragStart(col.key)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(col.key)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-grab active:cursor-grabbing group"
                >
                  <span className="text-gray-300 select-none text-sm">⠿</span>
                  <button
                    onClick={() => toggleVisible(col.key)}
                    className={`w-8 text-center text-sm font-bold flex-shrink-0 rounded ${visible ? "text-blue-500 hover:text-blue-700" : "text-gray-300 hover:text-gray-500"}`}
                    title={visible ? "Hide column" : "Show column"}
                  >
                    {visible ? "●" : "○"}
                  </button>
                  <span className={`flex-1 text-sm ${visible ? "text-gray-800" : "text-gray-400"}`}>
                    {col.label}
                    {col.isCustom && (
                      <span className="ml-1 text-xs text-blue-400 font-medium">custom</span>
                    )}
                  </span>
                  {col.isCustom && (
                    <button
                      onClick={() => removeCustomCol(col.key)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 text-xs"
                      title="Remove column"
                    >
                      ✕
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="px-5 py-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Add custom column</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Column name"
              value={newLabel}
              onChange={e => { setNewLabel(e.target.value); setAddError("") }}
              onKeyDown={e => e.key === "Enter" && addCustomCol()}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={addCustomCol}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
        </div>
      </div>
    </div>
  )
}
