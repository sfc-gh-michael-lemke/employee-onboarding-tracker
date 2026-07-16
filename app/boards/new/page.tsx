"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"

interface ExtractedEmployee {
  fullName: string
  title: string
  startDate: string | null
  manager: string | null
  territory: string | null
  include: boolean
}

interface ExtractedTask {
  key: string
  label: string
  description: string
  verifiedTestQuery: string | null
  include: boolean
}

interface ExtractedPhase {
  key: string
  label: string
  description: string
  tasks: ExtractedTask[]
  include: boolean
}

interface ExtractResult {
  boardName: string
  employees: ExtractedEmployee[]
  phases: ExtractedPhase[]
}

type Step = "drop" | "extracting" | "preview" | "creating"

// ── PDF text extraction (pdfjs-dist) ─────────────────────────────────────────
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

// ── DOCX text extraction (mammoth browser build) ──────────────────────────────
async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value
}

export default function NewBoardPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("drop")
  const [dragOver, setDragOver] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [extractError, setExtractError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [boardName, setBoardName] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)

  const runExtract = useCallback(async (text: string) => {
    setStep("extracting")
    setExtractError(null)
    try {
      const res = await fetch("/api/boards/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const rawText = await res.text()
      let data: Record<string, unknown>
      try {
        data = JSON.parse(rawText)
      } catch {
        throw new Error("Service unavailable — please try again in a moment.")
      }
      if (!res.ok) throw new Error((data.error as string) ?? "Extraction failed")
      const extracted: ExtractResult = {
        boardName: (data.boardName as string) ?? "New Board",
        employees: (Array.isArray(data.employees) ? data.employees : []).map(
          (e: Omit<ExtractedEmployee, "include">) => ({ ...e, include: true })
        ),
        phases: (Array.isArray(data.phases) ? data.phases : []).map(
          (p: Omit<ExtractedPhase, "include">) => ({
            ...p,
            include: true,
            tasks: (Array.isArray(p.tasks) ? p.tasks : []).map(
              (t: Omit<ExtractedTask, "include">) => ({ ...t, include: true })
            ),
          })
        ),
      }
      setResult(extracted)
      setBoardName(extracted.boardName)
      setStep("preview")
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Failed")
      setStep("drop")
    }
  }, [])

  async function handleFile(file: File) {
    const name = file.name.toLowerCase()
    setExtractError(null)
    try {
      if (name.endsWith(".csv") || file.type === "text/csv" || file.type === "text/plain") {
        const text = await file.text()
        runExtract(text)
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet") || file.type.includes("excel")) {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf)
        const text = wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n\n")
        runExtract(text)
      } else if (name.endsWith(".pdf")) {
        setStep("extracting")
        const text = await extractPdfText(file)
        runExtract(text)
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        setStep("extracting")
        const text = await extractDocxText(file)
        runExtract(text)
      } else {
        const text = await file.text()
        runExtract(text)
      }
    } catch {
      setExtractError("Could not read file. Please paste the document text below.")
    }
  }

  function handlePaste() {
    if (!pasteText.trim()) return
    runExtract(pasteText.trim())
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function toggleEmployee(i: number) {
    setResult(r => r ? { ...r, employees: r.employees.map((e, idx) => idx === i ? { ...e, include: !e.include } : e) } : r)
  }

  function togglePhase(i: number) {
    setResult(r => r ? { ...r, phases: r.phases.map((p, idx) => idx === i ? { ...p, include: !p.include } : p) } : r)
  }

  function toggleTask(phaseIdx: number, taskIdx: number) {
    setResult(r => r ? {
      ...r,
      phases: r.phases.map((p, i) => i !== phaseIdx ? p : {
        ...p,
        tasks: p.tasks.map((t, j) => j !== taskIdx ? t : { ...t, include: !t.include })
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
      // 1. Create the board
      const boardRes = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName.trim(), description: "" }),
      })
      if (!boardRes.ok) throw new Error((await boardRes.json()).error)
      const board = await boardRes.json()

      // 2. Create employees on the board
      const empPromises = result.employees
        .filter(e => e.include && e.fullName?.trim())
        .map(e => fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: e.fullName, title: e.title ?? "",
            startDate: e.startDate ?? "", manager: e.manager ?? "",
            territory: e.territory ?? "", notes: "",
            boardId: board.ID,
          }),
        }))
      await Promise.all(empPromises)

      // 3. Bulk-insert all selected phases + tasks in one request
      const selectedPhases = result.phases
        .filter(p => p.include && p.key && p.label)
        .map(p => ({ ...p, tasks: (p.tasks ?? []).filter(t => t.include && t.key && t.label) }))

      if (selectedPhases.length > 0) {
        const phaseRes = await fetch(`/api/boards/${board.ID}/phases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Boards</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">New Board</h1>
      </div>

      {/* ── STEP: Drop zone ───────────────────────────────── */}
      {(step === "drop" || step === "extracting") && (
        <div className="space-y-6">
          {extractError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {extractError}
            </div>
          )}

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${step === "extracting" ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {step === "extracting" ? (
              <div className="space-y-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500">Reading document and extracting data with AI…</p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">&#128196;</div>
                <p className="text-base font-medium text-gray-700">Drop a document here</p>
                <p className="text-sm text-gray-400 mt-1">PDF, Word (.docx), Excel (.xlsx / .xls), or CSV</p>
                <p className="text-xs text-gray-300 mt-3">or click to browse</p>
              </>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or paste document text</span>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={6}
              placeholder="Paste the contents of a new hire list, onboarding document, org chart, etc."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handlePaste}
                disabled={!pasteText.trim() || step === "extracting"}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Extract with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: Preview ─────────────────────────────────── */}
      {(step === "preview" || step === "creating") && result && (
        <div className="space-y-8">
          {createError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {createError}
            </div>
          )}

          {/* Board name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Board name</label>
            <input
              type="text"
              value={boardName}
              onChange={e => setBoardName(e.target.value)}
              className="w-full max-w-md text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Employees preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Employees <span className="text-gray-400 font-normal">({result.employees.filter(e => e.include).length} selected)</span>
              </h2>
              <button
                onClick={() => setResult(r => r ? { ...r, employees: r.employees.map(e => ({ ...e, include: true })) } : r)}
                className="text-xs text-blue-600 hover:underline"
              >
                Select all
              </button>
            </div>
            {result.employees.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No employees found in document.</p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Manager</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Territory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.employees.map((emp, i) => (
                      <tr key={i} className={emp.include ? "" : "opacity-40"}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={emp.include} onChange={() => toggleEmployee(i)} className="rounded" />
                        </td>
                        {(["fullName", "title", "startDate", "manager", "territory"] as const).map(field => (
                          <td key={field} className="px-3 py-1.5">
                            <input
                              type="text"
                              value={(emp[field] as string) ?? ""}
                              onChange={e => updateEmployee(i, field, e.target.value)}
                              className="w-full text-xs border border-transparent rounded px-1 py-0.5 hover:border-gray-200 focus:border-blue-300 focus:outline-none"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Phases + tasks preview */}
          {result.phases.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Onboarding phases &amp; tasks{" "}
                  <span className="text-gray-400 font-normal">
                    ({result.phases.filter(p => p.include).length} phases,{" "}
                    {result.phases.flatMap(p => p.tasks ?? []).filter(t => t.include).length} tasks)
                  </span>
                </h2>
                <span className="text-xs text-gray-400">Tagged to this board</span>
              </div>
              <div className="space-y-3">
                {result.phases.map((phase, pi) => (
                  <div key={pi} className={`rounded-lg border transition-colors ${phase.include ? "border-blue-200 bg-blue-50/30" : "border-gray-200 opacity-50"}`}>
                    {/* Phase header */}
                    <label className="flex items-start gap-3 p-3 cursor-pointer">
                      <input type="checkbox" checked={phase.include} onChange={() => togglePhase(pi)} className="mt-0.5 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800">{phase.label}</div>
                        {phase.description && <div className="text-xs text-gray-500 mt-0.5">{phase.description}</div>}
                      </div>
                    </label>
                    {/* Tasks */}
                    {phase.include && (phase.tasks ?? []).length > 0 && (
                      <div className="border-t border-blue-100 divide-y divide-blue-50">
                        {(phase.tasks ?? []).map((task, ti) => (
                          <div key={ti} className={`px-4 py-2.5 ${task.include ? "" : "opacity-40"}`}>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input type="checkbox" checked={task.include} onChange={() => toggleTask(pi, ti)} className="mt-0.5 rounded" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-700">{task.label}</div>
                                {task.description && <div className="text-xs text-gray-400 mt-0.5">{task.description}</div>}
                                {task.verifiedTestQuery && (
                                  <details className="mt-1">
                                    <summary className="text-xs text-blue-500 cursor-pointer hover:text-blue-700">SQL check</summary>
                                    <pre className="mt-1 text-xs bg-gray-800 text-green-300 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                                      {task.verifiedTestQuery}
                                    </pre>
                                  </details>
                                )}
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

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={step === "creating" || !boardName.trim() || result.employees.filter(e => e.include).length === 0}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {step === "creating" ? "Creating…" : `Create board with ${result.employees.filter(e => e.include).length} employees · ${result.phases.filter(p => p.include).length} phases`}
            </button>
            <button
              onClick={() => { setStep("drop"); setResult(null); setPasteText("") }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
