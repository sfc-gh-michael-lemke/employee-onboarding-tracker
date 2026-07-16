"use client"

import { useEffect, useRef, useState } from "react"
import type { Phase } from "@/lib/phases"

// ── Inline editable field ────────────────────────────────────────────────────
function EditableField({
  value, multiline, className, placeholder, onSave,
}: {
  value: string
  multiline?: boolean
  className?: string
  placeholder?: string
  onSave: (next: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const [status, setStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle")
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])

  function startEdit() { setDraft(value); setEditing(true); setStatus("idle"); setTimeout(() => ref.current?.focus(), 0) }

  async function commit() {
    if (draft === value) { setEditing(false); return }
    setStatus("saving")
    try { await onSave(draft); setStatus("saved"); setTimeout(() => setStatus("idle"), 1500) }
    catch { setStatus("error") }
    finally { setEditing(false) }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) { e.preventDefault(); commit() }
    if (e.key === "Escape") { setEditing(false); setDraft(value) }
  }

  const ring = status === "saved" ? "ring-2 ring-green-400" : status === "error" ? "ring-2 ring-red-400" : status === "saving" ? "ring-2 ring-blue-300 animate-pulse" : ""

  if (editing) {
    const shared = {
      ref, value: draft, placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit, onKeyDown,
      className: `w-full bg-white border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${ring} ${className ?? ""}`,
    }
    return multiline ? <textarea {...shared} rows={4} style={{ resize: "vertical" }} /> : <input type="text" {...shared} />
  }

  return (
    <span className={`group/field cursor-text ${className ?? ""}`} onClick={startEdit} title="Click to edit">
      {value ? value : <em className="text-gray-300 not-italic">{placeholder ?? "—"}</em>}
      {status === "saved" && <span className="ml-1 text-xs text-green-500">✓</span>}
      <span className="ml-1 opacity-0 group-hover/field:opacity-50 text-gray-400 text-xs select-none">✎</span>
    </span>
  )
}

// ── Query result table ────────────────────────────────────────────────────────
interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  count: number
  error?: string
}

function ResultTable({ result }: { result: QueryResult }) {
  if (result.error) return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-mono whitespace-pre-wrap">{result.error}</div>
  )
  if (result.count === 0) return (
    <div className="p-3 rounded bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">No rows returned</div>
  )
  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <div className="text-xs text-gray-400 px-3 pt-1.5 pb-0.5">{result.count} row{result.count !== 1 ? "s" : ""}</div>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            {result.columns.map(c => (
              <th key={c} className="px-3 py-1.5 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {result.rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {result.columns.map(c => (
                <td key={c} className="px-3 py-1.5 text-gray-700 whitespace-nowrap max-w-xs truncate" title={String(row[c] ?? "")}>
                  {row[c] === null || row[c] === undefined ? <span className="text-gray-300 italic">null</span> : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Run button ────────────────────────────────────────────────────────────────
function RunQuery({
  sql, email, userId, runTrigger, phaseKey, itemKey, onResult,
}: {
  sql: string
  email: string
  userId: string
  runTrigger: number
  phaseKey: string
  itemKey: string
  onResult: (r: QueryResult | null) => void
}) {
  const [running, setRunning]     = useState(false)
  const [autoChecked, setAutoChecked] = useState<"checking" | "checked" | "no_employee" | null>(null)

  useEffect(() => {
    if (runTrigger > 0 && sql && (email || userId)) run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runTrigger])

  async function run() {
    if (!email.trim() && !userId.trim()) { alert("Enter a rep email or user ID first"); return }
    setRunning(true)
    setAutoChecked(null)
    onResult(null)
    try {
      const res = await fetch("/api/run-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, email: email.trim(), user_id: userId.trim() }),
      })
      const data = await res.json()
      const result = res.ok ? data : { columns: [], rows: [], count: 0, error: data.error }
      onResult(result)

      // Auto-check if rows returned and we have an email
      if (result.count > 0 && email.trim()) {
        setAutoChecked("checking")
        const checkRes = await fetch("/api/auto-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), phase_key: phaseKey, item_key: itemKey }),
        })
        const checkData = await checkRes.json()
        if (checkData.reason === "no_employee") setAutoChecked("no_employee")
        else setAutoChecked("checked")
      }
    } catch (e) {
      onResult({ columns: [], rows: [], count: 0, error: e instanceof Error ? e.message : "Failed" })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={run}
        disabled={running}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {running ? <span className="animate-spin">⟳</span> : "▶"} {running ? "…" : "Run"}
      </button>
      {autoChecked === "checking" && (
        <span className="text-xs text-blue-500 animate-pulse">Testing…</span>
      )}
      {(autoChecked === "checked" || autoChecked === "no_employee") && (
        <span className="text-xs text-green-600 font-medium">Test result: Pass</span>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PhasesPage() {
  const [phases, setPhases]         = useState<Phase[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [email, setEmail]           = useState("")
  const [userId, setUserId]         = useState("")
  const [runTrigger, setRunTrigger] = useState(0)
  const [runningAll, setRunningAll] = useState(false)
  const [results, setResults]       = useState<Record<string, QueryResult | null>>({})

  // Board selector
  const [boards, setBoards]       = useState<Array<{ ID: string; NAME: string }>>([])
  const [boardId, setBoardId]     = useState<string>("__global__")

  // Add phase / add task dialogs
  const [addPhaseOpen, setAddPhaseOpen]   = useState(false)
  const [addTaskOpen, setAddTaskOpen]     = useState<string | null>(null)
  const [addForm, setAddForm]             = useState({ label: "", description: "", key: "" })
  const [addSaving, setAddSaving]         = useState(false)
  const [addError, setAddError]           = useState<string | null>(null)

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40)
  }

  // Load boards once
  useEffect(() => {
    fetch("/api/boards")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBoards(data) })
      .catch(() => {})
  }, [])

  // Load phases whenever boardId changes
  useEffect(() => {
    setLoading(true)
    const url = boardId === "__global__" ? "/api/phases" : `/api/phases?board_id=${boardId}`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error(data?.error ?? JSON.stringify(data))
        setPhases(data)
        setLoading(false)
      })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [boardId])

  async function handleAddPhase() {
    if (!addForm.label.trim()) return
    setAddSaving(true); setAddError(null)
    const key = addForm.key.trim() || slugify(addForm.label)
    try {
      const res = await fetch("/api/phases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase_key: key, item_key: null, label: addForm.label, description: addForm.description, board_id: boardId === "__global__" ? null : boardId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPhases(prev => [...prev, { key, label: addForm.label, description: addForm.description, items: [], links: [] }])
      setAddPhaseOpen(false); setAddForm({ label: "", description: "", key: "" })
    } catch (e) { setAddError(e instanceof Error ? e.message : "Failed") }
    finally { setAddSaving(false) }
  }

  async function handleAddTask(phaseKey: string) {
    if (!addForm.label.trim()) return
    setAddSaving(true); setAddError(null)
    const key = addForm.key.trim() || slugify(addForm.label)
    try {
      const res = await fetch("/api/phases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase_key: phaseKey, item_key: key, label: addForm.label, description: addForm.description, board_id: boardId === "__global__" ? null : boardId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPhases(prev => prev.map(p =>
        p.key !== phaseKey ? p : {
          ...p,
          items: [...p.items, { key, label: addForm.label, description: addForm.description, links: [] }]
        }
      ))
      setAddTaskOpen(null); setAddForm({ label: "", description: "", key: "" })
    } catch (e) { setAddError(e instanceof Error ? e.message : "Failed") }
    finally { setAddSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>

  async function saveField(
    phaseKey: string, itemKey: string | null,
    field: "label" | "description" | "verified_test_query", value: string,
  ) {
    const res = await fetch("/api/phases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase_key: phaseKey, item_key: itemKey, [field]: value, board_id: boardId === "__global__" ? null : boardId }),
    })
    if (!res.ok) throw new Error(await res.text())
    const stateKey = field === "verified_test_query" ? "verifiedTestQuery" : field
    setPhases(prev => prev.map(p => {
      if (p.key !== phaseKey) return p
      if (!itemKey) return { ...p, [stateKey]: value }
      return { ...p, items: p.items.map(it => it.key === itemKey ? { ...it, [stateKey]: value } : it) }
    }))
  }

  async function deleteItem(phaseKey: string, itemKey: string) {
    if (!confirm(`Delete "${itemKey}"? This can be restored in Snowflake.`)) return
    const res = await fetch("/api/phases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase_key: phaseKey, item_key: itemKey, hidden: true, board_id: boardId === "__global__" ? null : boardId }),
    })
    if (!res.ok) { alert("Delete failed"); return }
    setPhases(prev => prev.map(p =>
      p.key !== phaseKey ? p : { ...p, items: p.items.filter(it => it.key !== itemKey) }
    ))
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
  if (error)   return <div className="p-8 text-red-600 text-sm">Error: {error}</div>

  const totalItems = phases.reduce((s, p) => s + p.items.length, 0)

  return (
    <main className="px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">Onboarding Phases &amp; Tasks</h1>
          <p className="text-sm text-gray-400">
            {phases.length} phases · {totalItems} tasks ·{" "}
            <span className="text-blue-500">click any cell to edit</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Board selector */}
          <select
            value={boardId}
            onChange={e => setBoardId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="__global__">Global phases</option>
            {boards.map(b => (
              <option key={b.ID} value={b.ID}>{b.NAME}</option>
            ))}
          </select>
          <button
            onClick={() => { setAddForm({ label: "", description: "", key: "" }); setAddError(null); setAddPhaseOpen(true) }}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >+ Add Phase</button>
          <a href="/admin" className="text-sm text-blue-600 hover:underline">← Admin</a>
        </div>
      </div>

      {/* Sticky control bar — Run All button lives INSIDE the flex row */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-4 py-2.5 mb-5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-44">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="first.last@snowflake.com"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-44">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="005Do000001zzbEIAQ"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            />
          </div>
          <button
            onClick={() => {
              if (!email.trim() && !userId.trim()) { alert("Enter an email or user ID first"); return }
              setRunningAll(true)
              setRunTrigger(t => t + 1)
              setTimeout(() => setRunningAll(false), 3000)
            }}
            disabled={runningAll || (!email && !userId)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {runningAll ? <><span className="animate-spin inline-block">⟳</span> Running…</> : "▶▶ Run All"}
          </button>
        </div>
        {(email || userId) && (
          <p className="text-xs text-gray-400 mt-1.5">
            {email  && <><code className="bg-gray-100 px-1 rounded">:email</code> → <span className="text-gray-600">{email}</span>{userId ? "  ·  " : ""}</>}
            {userId && <><code className="bg-gray-100 px-1 rounded">:user_id</code> → <span className="text-gray-600 font-mono">{userId}</span></>}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phase</th>
              <th className="w-10 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="w-52 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Task</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th className="w-72 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Verified Test Query</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Run</th>
              <th className="w-10 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {phases.flatMap((phase, pi) => {
              const itemRows = phase.items.flatMap((item, ii) => {
                const vtq: string        = (item as any).verifiedTestQuery ?? ""
                const resultKey          = `${phase.key}/${item.key}`
                const result             = results[resultKey]
                const isFirstInPhase     = ii === 0

                const itemRow = (
                  <tr
                    key={resultKey}
                    className={`hover:bg-gray-50 transition-colors ${isFirstInPhase && pi > 0 ? "border-t-2 border-gray-200" : ""}`}
                  >
                    {/* Phase column — label only on first item of phase */}
                    <td className="px-4 py-3 align-top">
                      {isFirstInPhase ? (
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                            {pi + 1}
                          </span>
                          <EditableField
                            value={phase.label}
                            className="text-xs font-semibold text-gray-700"
                            onSave={v => saveField(phase.key, null, "label", v)}
                          />
                        </div>
                      ) : null}
                    </td>

                    {/* # */}
                    <td className="px-3 py-3 align-top text-xs font-mono text-gray-400 whitespace-nowrap">
                      {pi + 1}.{ii + 1}
                    </td>

                    {/* Task label */}
                    <td className="px-4 py-3 align-top">
                      <EditableField
                        value={item.label}
                        className="text-sm font-medium text-gray-800"
                        onSave={v => saveField(phase.key, item.key, "label", v)}
                      />
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 align-top text-xs text-gray-500">
                      <EditableField
                        value={item.description ?? ""}
                        multiline
                        className="text-xs text-gray-500 leading-relaxed"
                        placeholder="Add description…"
                        onSave={v => saveField(phase.key, item.key, "description", v)}
                      />
                    </td>

                    {/* Verified test query */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5 mb-1">
                        {(item as any).suggestedQuery && !vtq && (
                          <button
                            onClick={async () => saveField(phase.key, item.key, "verified_test_query", (item as any).suggestedQuery)}
                            className="px-1.5 py-0.5 text-xs rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap"
                          >↑ Use suggested</button>
                        )}
                      </div>
                      <EditableField
                        value={vtq}
                        multiline
                        className="text-xs font-mono text-gray-600 bg-gray-100 rounded px-2 py-1 whitespace-pre-wrap block w-full"
                        placeholder="-- SQL to verify this task"
                        onSave={v => saveField(phase.key, item.key, "verified_test_query", v)}
                      />
                    </td>

                    {/* Run */}
                    <td className="px-4 py-3 align-top">
                      {vtq && (
                        <RunQuery
                          sql={vtq}
                          email={email}
                          userId={userId}
                          runTrigger={runTrigger}
                          phaseKey={phase.key}
                          itemKey={item.key}
                          onResult={r => setResults(prev => ({ ...prev, [resultKey]: r }))}
                        />
                      )}
                      {result && (
                        <button
                          onClick={() => setResults(prev => ({ ...prev, [resultKey]: null }))}
                          className="mt-1 block text-xs text-gray-400 hover:text-gray-600"
                        >dismiss</button>
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-3 py-3 align-top">
                      <button
                        onClick={() => deleteItem(phase.key, item.key)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete item"
                      >✕</button>
                    </td>
                  </tr>
                )

                // Full-width result row inserted below item row when results exist
                const resultRow = result ? (
                  <tr key={`${resultKey}-result`} className="bg-blue-50/30">
                    <td colSpan={7} className="px-6 py-3">
                      <ResultTable result={result} />
                    </td>
                  </tr>
                ) : null

                return resultRow ? [itemRow, resultRow] : [itemRow]
              })
              // Add Task row at end of each phase
              const addTaskRow = (
                <tr key={`${phase.key}-add-task`} className="border-b border-gray-100">
                  <td className="px-4 py-2" />
                  <td className="px-3 py-2" />
                  <td colSpan={4} className="px-4 py-2">
                    <button
                      onClick={() => { setAddForm({ label: "", description: "", key: "" }); setAddError(null); setAddTaskOpen(phase.key) }}
                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                    >+ Add task to this phase</button>
                  </td>
                  <td className="px-3 py-2" />
                </tr>
              )
              return [...itemRows, addTaskRow]
            })}
          </tbody>
        </table>
      </div>

      {/* Add Phase dialog */}
      {addPhaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold mb-4">Add New Phase</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Phase Name *</label>
                <input autoFocus value={addForm.label} onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Ramp Completion" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <input value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Key (auto-generated if blank)</label>
                <input value={addForm.key} onChange={e => setAddForm(f => ({ ...f, key: e.target.value }))}
                  placeholder={addForm.label ? slugify(addForm.label) : "phase_key"} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setAddPhaseOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddPhase} disabled={addSaving || !addForm.label.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {addSaving ? "Adding…" : "Add Phase"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task dialog */}
      {addTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold mb-1">Add Task</h3>
            <p className="text-xs text-gray-400 mb-4">Phase: <span className="font-medium text-gray-600">{phases.find(p => p.key === addTaskOpen)?.label ?? addTaskOpen}</span></p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Task Name *</label>
                <input autoFocus value={addForm.label} onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Manager intro meeting scheduled" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <input value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Key (auto-generated if blank)</label>
                <input value={addForm.key} onChange={e => setAddForm(f => ({ ...f, key: e.target.value }))}
                  placeholder={addForm.label ? slugify(addForm.label) : "item_key"} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setAddTaskOpen(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleAddTask(addTaskOpen)} disabled={addSaving || !addForm.label.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {addSaving ? "Adding…" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
