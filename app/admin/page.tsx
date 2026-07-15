"use client"

import { useEffect, useState, useCallback } from "react"

interface Employee {
  ID: string
  FULL_NAME: string
  TITLE: string | null
  START_DATE: string | null
  MANAGER: string | null
  TERRITORY: string | null
  NOTES: string | null
}

type EditState = Partial<Omit<Employee, "ID">>

const COLS: { key: keyof Omit<Employee, "ID">; label: string; width: string; type?: string }[] = [
  { key: "FULL_NAME",  label: "Name",       width: "w-44" },
  { key: "TITLE",      label: "Title",      width: "w-44" },
  { key: "START_DATE", label: "Start Date", width: "w-32", type: "date" },
  { key: "MANAGER",    label: "Manager",    width: "w-40" },
  { key: "TERRITORY",  label: "Territory",  width: "w-40" },
  { key: "NOTES",      label: "Notes",      width: "w-64" },
]

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState<string | null>(null)   // employee ID being edited
  const [draft, setDraft]         = useState<EditState>({})
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState<string | null>(null)    // last saved ID
  const [error, setError]         = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/employees")
    const data = await res.json()
    setEmployees(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(emp: Employee) {
    setEditing(emp.ID)
    setDraft({
      FULL_NAME:  emp.FULL_NAME,
      TITLE:      emp.TITLE      ?? "",
      START_DATE: emp.START_DATE ?? "",
      MANAGER:    emp.MANAGER    ?? "",
      TERRITORY:  emp.TERRITORY  ?? "",
      NOTES:      emp.NOTES      ?? "",
    })
    setError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setDraft({})
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
      const body: Record<string, string | null> = {}
      for (const col of COLS) {
        const val = draft[col.key] as string | undefined
        body[col.key.toLowerCase()] = val === "" ? null : (val ?? null)
      }
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      setEmployees(prev =>
        prev.map(e => e.ID === id ? { ...e, ...draft as Employee } : e)
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
        <a href="/" className="text-sm text-blue-600 hover:underline">← Back to board</a>
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
              {COLS.map(c => (
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
                  {COLS.map(col => (
                    <td key={col.key} className={`${col.width} px-4 py-2.5`}>
                      {isEditing ? (
                        col.key === "NOTES" ? (
                          <textarea
                            className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            rows={2}
                            value={(draft[col.key] as string) ?? ""}
                            onChange={e => setDraft(d => ({ ...d, [col.key]: e.target.value }))}
                          />
                        ) : (
                          <input
                            type={col.type ?? "text"}
                            className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={(draft[col.key] as string) ?? ""}
                            onChange={e => setDraft(d => ({ ...d, [col.key]: e.target.value }))}
                          />
                        )
                      ) : (
                        <span className={`${!emp[col.key] ? "text-gray-300 italic" : "text-gray-800"}`}>
                          {emp[col.key] ?? "—"}
                        </span>
                      )}
                    </td>
                  ))}
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
    </main>
  )
}
