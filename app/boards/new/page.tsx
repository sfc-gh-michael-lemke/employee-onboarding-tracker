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

interface ExtractedPhase {
  key: string
  label: string
  description: string
  include: boolean
}

interface ExtractResult {
  boardName: string
  employees: ExtractedEmployee[]
  phases: ExtractedPhase[]
}

type Step = "drop" | "extracting" | "preview" | "creating"

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
          (p: Omit<ExtractedPhase, "include">) => ({ ...p, include: true })
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
        setExtractError("PDF files cannot be read directly. Please open the PDF, select all text (Cmd+A), copy it, and paste it in the text box below.")
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        setExtractError("Word documents cannot be read directly. Please open the file, select all text (Cmd+A), copy it, and paste it in the text box below.")
      } else {
        // Try as plain text
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

      // 3. Add extracted phases to PHASES_CONFIG
      const phasePromises = result.phases
        .filter(p => p.include && p.key && p.label)
        .map(p => fetch("/api/phases", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase_key: p.key, item_key: null, label: p.label, description: p.description }),
        }))
      await Promise.all(phasePromises)

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
                <p className="text-sm text-gray-400 mt-1">PDF, Word (.docx), Excel (.xlsx), or CSV</p>
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

          {/* Phases preview */}
          {result.phases.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Onboarding phases <span className="text-gray-400 font-normal">({result.phases.filter(p => p.include).length} selected)</span>
                </h2>
                <span className="text-xs text-gray-400">Selected phases will be added to the global phase list</span>
              </div>
              <div className="space-y-2">
                {result.phases.map((phase, i) => (
                  <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    phase.include ? "border-blue-200 bg-blue-50/50" : "border-gray-200 opacity-50"
                  }`}>
                    <input type="checkbox" checked={phase.include} onChange={() => togglePhase(i)} className="mt-0.5 rounded" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{phase.label}</div>
                      {phase.description && <div className="text-xs text-gray-500 mt-0.5">{phase.description}</div>}
                    </div>
                  </label>
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
              {step === "creating" ? "Creating…" : `Create board with ${result.employees.filter(e => e.include).length} employees`}
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
