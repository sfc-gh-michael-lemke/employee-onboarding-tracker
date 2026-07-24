"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { Plus, Trash2, ChevronDown, ChevronRight, FileText, Wrench, Layers } from "lucide-react"
import { OBJECT_TYPES, type ObjectType } from "@/lib/objectType"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedEmployee {
  fullName: string; title: string; startDate: string | null
  manager: string | null; territory: string | null; include: boolean
}
interface ExtractedTask {
  key: string; label: string; description: string
  verifiedTestQuery: string | null; include: boolean
}
interface ExtractedPhase {
  key: string; label: string; description: string
  tasks: ExtractedTask[]; include: boolean
}
interface ExtractResult {
  boardName: string; employees: ExtractedEmployee[]; phases: ExtractedPhase[]
}

type Step = "choose" | "manual" | "drop" | "extracting" | "preview" | "creating"

interface ManualPhase {
  label: string; description: string; expanded: boolean
  tasks: { label: string; description: string }[]
}

// ─── File helpers ─────────────────────────────────────────────────────────────

async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist")
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "))
  }
  return pages.join("\n\n")
}
async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewBoardPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("choose")
  const [boardName, setBoardName] = useState("")
  const [nameError, setNameError] = useState(false)
  const [objectType, setObjectType] = useState<ObjectType>("employee")

  // AI flow state
  const [dragOver, setDragOver] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [extractError, setExtractError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // Manual builder state
  const [manualPhases, setManualPhases] = useState<ManualPhase[]>([
    { label: "", description: "", expanded: true, tasks: [{ label: "", description: "" }] }
  ])

  // ── Validation helper ──────────────────────────────────────────────────────
  function requireName(): boolean {
    if (!boardName.trim()) { setNameError(true); return false }
    setNameError(false); return true
  }

  // ── Blank board ────────────────────────────────────────────────────────────
  async function handleBlank() {
    if (!requireName()) return
    setStep("creating")
    try {
      const res = await fetch("/api/boards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName.trim(), description: "", objectType }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const board = await res.json()
      router.push(`/boards/${board.ID}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed")
      setStep("choose")
    }
  }

  // ── AI extraction flow ─────────────────────────────────────────────────────
  const runExtract = useCallback(async (text: string) => {
    setStep("extracting")
    setExtractError(null)
    try {
      const res = await fetch("/api/boards/extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const rawText = await res.text()
      let data: Record<string, unknown>
      try { data = JSON.parse(rawText) } catch { throw new Error("Service unavailable — please try again.") }
      if (!res.ok) throw new Error((data.error as string) ?? "Extraction failed")
      const extracted: ExtractResult = {
        boardName: boardName.trim() || (data.boardName as string) || "New Board",
        employees: (Array.isArray(data.employees) ? data.employees : []).map(
          (e: Omit<ExtractedEmployee, "include">) => ({ ...e, include: true })
        ),
        phases: (Array.isArray(data.phases) ? data.phases : []).map(
          (p: Omit<ExtractedPhase, "include">) => ({
            ...p, include: true,
            tasks: (Array.isArray(p.tasks) ? p.tasks : []).map(
              (t: Omit<ExtractedTask, "include">) => ({ ...t, include: true })
            ),
          })
        ),
      }
      setResult(extracted)
      setStep("preview")
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Failed")
      setStep("drop")
    }
  }, [boardName])

  async function handleFile(file: File) {
    setExtractError(null)
    const name = file.name.toLowerCase()
    try {
      if (name.endsWith(".csv") || file.type === "text/csv" || file.type === "text/plain") {
        runExtract(await file.text())
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet") || file.type.includes("excel")) {
        const wb = XLSX.read(await file.arrayBuffer())
        runExtract(wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n\n"))
      } else if (name.endsWith(".pdf")) {
        setStep("extracting")
        runExtract(await extractPdfText(file))
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        setStep("extracting")
        runExtract(await extractDocxText(file))
      } else {
        runExtract(await file.text())
      }
    } catch { setExtractError("Could not read file. Please paste the document text below.") }
  }

  // ── Manual builder helpers ─────────────────────────────────────────────────
  function addPhase() {
    setManualPhases(p => [...p, { label: "", description: "", expanded: true, tasks: [{ label: "", description: "" }] }])
  }
  function removePhase(i: number) {
    setManualPhases(p => p.filter((_, idx) => idx !== i))
  }
  function updatePhase(i: number, field: "label" | "description", val: string) {
    setManualPhases(p => p.map((ph, idx) => idx === i ? { ...ph, [field]: val } : ph))
  }
  function togglePhaseExpanded(i: number) {
    setManualPhases(p => p.map((ph, idx) => idx === i ? { ...ph, expanded: !ph.expanded } : ph))
  }
  function addTask(pi: number) {
    setManualPhases(p => p.map((ph, idx) => idx === pi
      ? { ...ph, tasks: [...ph.tasks, { label: "", description: "" }] } : ph))
  }
  function removeTask(pi: number, ti: number) {
    setManualPhases(p => p.map((ph, idx) => idx === pi
      ? { ...ph, tasks: ph.tasks.filter((_, j) => j !== ti) } : ph))
  }
  function updateTask(pi: number, ti: number, field: "label" | "description", val: string) {
    setManualPhases(p => p.map((ph, idx) => idx !== pi ? ph : {
      ...ph, tasks: ph.tasks.map((t, j) => j === ti ? { ...t, [field]: val } : t)
    }))
  }

  async function handleCreateManual() {
    if (!requireName()) return
    const validPhases = manualPhases
      .filter(p => p.label.trim())
      .map((p, pi) => ({
        key: `phase_${pi + 1}`,
        label: p.label.trim(),
        description: p.description.trim(),
        tasks: p.tasks
          .filter(t => t.label.trim())
          .map((t, ti) => ({
            key: `task_${ti + 1}`,
            label: t.label.trim(),
            description: t.description.trim(),
            verifiedTestQuery: null,
            include: true,
          })),
        include: true,
      }))
    setStep("creating")
    setCreateError(null)
    try {
      const boardRes = await fetch("/api/boards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName.trim(), description: "", objectType }),
      })
      if (!boardRes.ok) throw new Error((await boardRes.json()).error)
      const board = await boardRes.json()
      if (validPhases.length > 0) {
        const phaseRes = await fetch(`/api/boards/${board.ID}/phases`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phases: validPhases }),
        })
        if (!phaseRes.ok) throw new Error((await phaseRes.json()).error ?? "Phase save failed")
      }
      router.push(`/boards/${board.ID}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed")
      setStep("manual")
    }
  }

  // ── AI preview create ──────────────────────────────────────────────────────
  function toggleEmployee(i: number) {
    setResult(r => r ? { ...r, employees: r.employees.map((e, idx) => idx === i ? { ...e, include: !e.include } : e) } : r)
  }
  function togglePhase(i: number) {
    setResult(r => r ? { ...r, phases: r.phases.map((p, idx) => idx === i ? { ...p, include: !p.include } : p) } : r)
  }
  function toggleTask(pi: number, ti: number) {
    setResult(r => r ? {
      ...r, phases: r.phases.map((p, i) => i !== pi ? p : {
        ...p, tasks: p.tasks.map((t, j) => j !== ti ? t : { ...t, include: !t.include })
      })
    } : r)
  }
  function updateEmployee(i: number, field: keyof ExtractedEmployee, val: string) {
    setResult(r => r ? { ...r, employees: r.employees.map((e, idx) => idx === i ? { ...e, [field]: val } : e) } : r)
  }

  async function handleCreate() {
    if (!result || !boardName.trim()) return
    setStep("creating")
    setCreateError(null)
    try {
      const boardRes = await fetch("/api/boards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName.trim(), description: "", objectType }),
      })
      if (!boardRes.ok) throw new Error((await boardRes.json()).error)
      const board = await boardRes.json()
      await Promise.all(
        result.employees.filter(e => e.include && e.fullName?.trim()).map(e =>
          fetch("/api/employees", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: e.fullName, title: e.title ?? "", startDate: e.startDate ?? "",
              manager: e.manager ?? "", territory: e.territory ?? "", notes: "", boardId: board.ID,
            }),
          })
        )
      )
      const selectedPhases = result.phases.filter(p => p.include && p.key && p.label)
        .map(p => ({ ...p, tasks: (p.tasks ?? []).filter(t => t.include && t.key && t.label) }))
      if (selectedPhases.length > 0) {
        const phaseRes = await fetch(`/api/boards/${board.ID}/phases`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phases: selectedPhases }),
        })
        if (!phaseRes.ok) throw new Error((await phaseRes.json()).error ?? "Phase save failed")
      }
      router.push(`/boards/${board.ID}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create board")
      setStep("preview")
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Boards</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">New Board</h1>
      </div>

      {/* ── STEP: Choose ─────────────────────────────────────── */}
      {step === "choose" && (
        <div className="space-y-8">
          {createError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{createError}</div>
          )}

          {/* Concept explainer */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">How it works</p>

            {/* Flow diagram */}
            <div className="flex items-stretch gap-1.5 mb-5 overflow-x-auto pb-1">
              {[
                { label: "Board", color: "bg-violet-100 border-violet-200 text-violet-800", dot: "bg-violet-400", desc: "The top-level container — one board per program, team, or initiative." },
                { label: "Phase", color: "bg-blue-100 border-blue-200 text-blue-800", dot: "bg-blue-400", desc: "A named stage in the process (e.g. \"Week 1\", \"Ramp\", \"Certified\")." },
                { label: "Task", color: "bg-cyan-100 border-cyan-200 text-cyan-800", dot: "bg-cyan-500", desc: "A step the object must complete within a phase (e.g. \"Complete onboarding doc\")." },
                { label: "Test", color: "bg-emerald-100 border-emerald-200 text-emerald-800", dot: "bg-emerald-500", desc: "An optional SQL query that auto-verifies a task is done — runs against Snowflake data." },
              ].map((item, i, arr) => (
                <div key={item.label} className="flex items-center gap-1.5 flex-shrink-0">
                  <div className={`flex flex-col gap-1 px-3 py-2.5 rounded-xl border text-center min-w-[88px] ${item.color}`}>
                    <span className="text-[11px] font-bold tracking-wide">{item.label}</span>
                    <span className="text-[10px] leading-snug opacity-75 hidden sm:block">{item.desc}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-gray-300 text-base font-light flex-shrink-0">→</span>
                  )}
                </div>
              ))}
            </div>

            {/* Object callout */}
            <div className="flex items-start gap-3 rounded-xl bg-white/70 border border-blue-100 px-4 py-3">
              <span className="text-lg mt-0.5">👤</span>
              <div>
                <span className="text-xs font-semibold text-gray-800">Object </span>
                <span className="text-xs text-gray-500">— the thing moving through the process. </span>
                <span className="text-xs text-gray-500">Each object (an employee, a process, or a role type) tracks its own progress independently across all phases and tasks. You pick the object type below.</span>
              </div>
            </div>

            {/* One-liner summary */}
            <p className="text-[11px] text-blue-400 mt-3 leading-relaxed">
              A board holds one <span className="font-semibold">process</span>. A process has <span className="font-semibold">phases</span>. Each phase has <span className="font-semibold">tasks</span>. Each task can have a SQL <span className="font-semibold">test</span> that auto-checks completion. Your <span className="font-semibold">objects</span> move through the process one task at a time.
            </p>
          </div>

          {/* Board name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Board name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={boardName}
              onChange={e => { setBoardName(e.target.value); if (nameError) setNameError(false) }}
              placeholder="e.g. FY27 Specialist Onboarding"
              className={`w-full text-sm border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${
                nameError ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">Please enter a board name first.</p>}
          </div>

          {/* Object type */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Object type</label>
            <div className="grid grid-cols-3 gap-3">
              {OBJECT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setObjectType(type.value)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all text-center focus:outline-none ${
                    objectType === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className={`text-xs font-semibold ${
                    objectType === type.value ? "text-blue-700" : "text-gray-700"
                  }`}>{type.label}</span>
                  <span className="text-[11px] text-gray-400 leading-tight">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Three options */}
          <div>
            <p className="text-sm text-gray-500 mb-4">How would you like to set up this board?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Blank */}
              <button
                onClick={handleBlank}
                className="group text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                  <Layers size={20} className="text-gray-500 group-hover:text-blue-600" />
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-1">Blank board</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Start empty and add {OBJECT_TYPES.find(t => t.value === objectType)?.plural.toLowerCase() ?? "people"} and phases later.
                </div>
              </button>

              {/* Manual */}
              <button
                onClick={() => { if (!requireName()) return; setStep("manual") }}
                className="group text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
                  <Wrench size={20} className="text-gray-500 group-hover:text-purple-600" />
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-1">Build manually</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Define phases and tasks step-by-step with the process builder.
                </div>
              </button>

              {/* AI Import */}
              <button
                onClick={() => { if (!requireName()) return; setStep("drop") }}
                className="group text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center mb-3 transition-colors">
                  <FileText size={20} className="text-gray-500 group-hover:text-emerald-600" />
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-1">Import from document</div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  Upload a PDF, Word, or Excel file and AI will extract phases and people automatically.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: Manual builder ──────────────────────────────── */}
      {(step === "manual" || (step === "creating" && !result)) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Process Builder
              <span className="ml-2 text-sm font-normal text-gray-400">— {boardName}</span>
            </h2>
            <button onClick={() => setStep("choose")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back
            </button>
          </div>

          {createError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{createError}</div>
          )}

          <div className="space-y-3">
            {manualPhases.map((phase, pi) => (
              <div key={pi} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Phase header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <button onClick={() => togglePhaseExpanded(pi)} className="text-gray-400 hover:text-gray-600 shrink-0">
                    {phase.expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  <div className="flex-1 min-w-0 flex gap-2">
                    <input
                      type="text"
                      value={phase.label}
                      onChange={e => updatePhase(pi, "label", e.target.value)}
                      placeholder={`Phase ${pi + 1} name`}
                      className="flex-1 text-sm font-medium bg-transparent focus:outline-none placeholder-gray-300 border-b border-transparent focus:border-gray-300"
                    />
                    <input
                      type="text"
                      value={phase.description}
                      onChange={e => updatePhase(pi, "description", e.target.value)}
                      placeholder="Description (optional)"
                      className="flex-1 text-xs text-gray-500 bg-transparent focus:outline-none placeholder-gray-300 border-b border-transparent focus:border-gray-200"
                    />
                  </div>
                  {manualPhases.length > 1 && (
                    <button onClick={() => removePhase(pi)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Tasks */}
                {phase.expanded && (
                  <div className="bg-white divide-y divide-gray-50">
                    {phase.tasks.map((task, ti) => (
                      <div key={ti} className="flex items-center gap-2 pl-8 pr-3 py-2.5">
                        <div className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        <input
                          type="text"
                          value={task.label}
                          onChange={e => updateTask(pi, ti, "label", e.target.value)}
                          placeholder={`Task ${ti + 1}`}
                          className="flex-1 text-xs focus:outline-none placeholder-gray-300 border-b border-transparent focus:border-gray-200 py-0.5"
                        />
                        <input
                          type="text"
                          value={task.description}
                          onChange={e => updateTask(pi, ti, "description", e.target.value)}
                          placeholder="Description (optional)"
                          className="flex-1 text-xs text-gray-400 focus:outline-none placeholder-gray-300 border-b border-transparent focus:border-gray-200 py-0.5"
                        />
                        {phase.tasks.length > 1 && (
                          <button onClick={() => removeTask(pi, ti)} className="text-gray-200 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="pl-8 pr-3 py-2">
                      <button onClick={() => addTask(pi)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                        <Plus size={11} /> Add task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={addPhase} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors border-2 border-dashed border-gray-200 hover:border-blue-300 w-full justify-center py-3 rounded-xl">
            <Plus size={15} /> Add phase
          </button>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreateManual}
              disabled={step === "creating"}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {step === "creating" ? "Creating…" : "Create board"}
            </button>
            <button onClick={() => setStep("choose")} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              Back
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: AI drop zone ────────────────────────────────── */}
      {(step === "drop" || step === "extracting") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Import from document</h2>
              <p className="text-sm text-gray-400 mt-0.5">Board: <span className="font-medium text-gray-600">{boardName}</span></p>
            </div>
            <button onClick={() => setStep("choose")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back
            </button>
          </div>

          {extractError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{extractError}</div>
          )}

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${step === "extracting" ? "pointer-events-none opacity-60" : ""}`}
          >
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {step === "extracting" ? (
              <div className="space-y-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500">Reading document and extracting data with AI…</p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">📄</div>
                <p className="text-base font-medium text-gray-700">Drop a process document here</p>
                <p className="text-sm text-gray-400 mt-1">PDF, Word (.docx), Excel (.xlsx / .xls), or CSV</p>
                <p className="text-xs text-gray-300 mt-3">or click to browse</p>
              </>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or paste document text</span>
            </div>
          </div>

          <div className="space-y-2">
            <textarea rows={5} placeholder="Paste the contents of your process documentation here…"
              value={pasteText} onChange={e => setPasteText(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            <div className="flex justify-end">
              <button onClick={() => { if (pasteText.trim()) runExtract(pasteText.trim()) }}
                disabled={!pasteText.trim() || step === "extracting"}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
                Extract with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: Preview ─────────────────────────────────────── */}
      {(step === "preview" || (step === "creating" && result)) && result && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Review extracted data</h2>
              <p className="text-sm text-gray-400 mt-0.5">Board: <span className="font-medium text-gray-600">{boardName}</span></p>
            </div>
          </div>

          {createError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{createError}</div>
          )}

          {/* Employees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Employees <span className="text-gray-400 font-normal">({result.employees.filter(e => e.include).length} selected)</span>
              </h3>
              <button onClick={() => setResult(r => r ? { ...r, employees: r.employees.map(e => ({ ...e, include: true })) } : r)}
                className="text-xs text-blue-600 hover:underline">Select all</button>
            </div>
            {result.employees.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No employees found in document.</p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      {["Name", "Title", "Start Date", "Manager", "Territory"].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.employees.map((emp, i) => (
                      <tr key={i} className={emp.include ? "" : "opacity-40"}>
                        <td className="px-3 py-2"><input type="checkbox" checked={emp.include} onChange={() => toggleEmployee(i)} className="rounded" /></td>
                        {(["fullName", "title", "startDate", "manager", "territory"] as const).map(field => (
                          <td key={field} className="px-3 py-1.5">
                            <input type="text" value={(emp[field] as string) ?? ""}
                              onChange={e => updateEmployee(i, field, e.target.value)}
                              className="w-full text-xs border border-transparent rounded px-1 py-0.5 hover:border-gray-200 focus:border-blue-300 focus:outline-none" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Phases */}
          {result.phases.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Phases &amp; tasks{" "}
                  <span className="text-gray-400 font-normal">
                    ({result.phases.filter(p => p.include).length} phases, {result.phases.flatMap(p => p.tasks ?? []).filter(t => t.include).length} tasks)
                  </span>
                </h3>
              </div>
              <div className="space-y-2">
                {result.phases.map((phase, pi) => (
                  <div key={pi} className={`rounded-xl border transition-colors ${phase.include ? "border-blue-200 bg-blue-50/30" : "border-gray-200 opacity-50"}`}>
                    <label className="flex items-start gap-3 p-3 cursor-pointer">
                      <input type="checkbox" checked={phase.include} onChange={() => togglePhase(pi)} className="mt-0.5 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800">{phase.label}</div>
                        {phase.description && <div className="text-xs text-gray-500 mt-0.5">{phase.description}</div>}
                      </div>
                    </label>
                    {phase.include && (phase.tasks ?? []).length > 0 && (
                      <div className="border-t border-blue-100 divide-y divide-blue-50">
                        {(phase.tasks ?? []).map((task, ti) => (
                          <div key={ti} className={`px-4 py-2.5 ${task.include ? "" : "opacity-40"}`}>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input type="checkbox" checked={task.include} onChange={() => toggleTask(pi, ti)} className="mt-0.5 rounded" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-700">{task.label}</div>
                                {task.description && <div className="text-xs text-gray-400 mt-0.5">{task.description}</div>}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={step === "creating" || !boardName.trim() || result.employees.filter(e => e.include).length === 0}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {step === "creating" ? "Creating…" : `Create board · ${result.employees.filter(e => e.include).length} employees · ${result.phases.filter(p => p.include).length} phases`}
            </button>
            <button onClick={() => { setStep("drop"); setResult(null); setPasteText("") }}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              Re-import
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
