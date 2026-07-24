"use client"

import { useRef, useState } from "react"
import { X, Upload, Sparkles, Trash2, Check } from "lucide-react"

interface ImportObject {
  fullName: string
  title: string | null
  startDate: string | null
  manager: string | null
  territory: string | null
  notes: string | null
}

type Step = "input" | "extracting" | "preview" | "importing" | "done"

export function BulkImportDialog({
  boardId,
  boardName,
  objectSingular,
  objectPlural,
  onClose,
  onImported,
}: {
  boardId: string
  boardName: string
  objectSingular: string
  objectPlural: string
  onClose: () => void
  onImported: (employees: Array<Record<string, string>>) => void
}) {
  const [step, setStep] = useState<Step>("input")
  const [pasteText, setPasteText] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [objects, setObjects] = useState<ImportObject[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Derive objectType from singular label
  const objectType =
    objectSingular.toLowerCase() === "process"
      ? "process"
      : objectSingular.toLowerCase() === "role type"
      ? "role_type"
      : "employee"

  const fieldLabels: Record<keyof ImportObject, string> = {
    fullName: objectSingular === "Employee" ? "Full Name" : "Name",
    title:
      objectType === "process"
        ? "Owner / Team"
        : objectType === "role_type"
        ? "Level / Tier"
        : "Title",
    startDate: objectType === "employee" ? "Start Date" : null as unknown as string,
    manager:
      objectType === "process"
        ? "Stakeholder"
        : objectType === "role_type"
        ? "Reports To"
        : "Manager",
    territory:
      objectType === "process"
        ? "Business Area"
        : objectType === "role_type"
        ? "Department"
        : "Territory",
    notes: "Notes",
  }

  const visibleFields: Array<keyof ImportObject> = (
    objectType === "employee"
      ? ["fullName", "title", "startDate", "manager", "territory", "notes"]
      : ["fullName", "title", "manager", "territory", "notes"]
  ) as Array<keyof ImportObject>

  function readFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setPasteText((e.target?.result as string) ?? "")
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  async function handleExtract() {
    if (!pasteText.trim()) {
      setError("Add a file or paste some text first.")
      return
    }
    setError(null)
    setStep("extracting")
    try {
      const res = await fetch(`/api/boards/${boardId}/extract-objects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText, objectType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Extraction failed")
      const extracted: ImportObject[] = (data.objects ?? []).filter(
        (o: ImportObject) => o.fullName?.trim()
      )
      if (extracted.length === 0) {
        setError("AI couldn't find any objects in this content. Try pasting clearer text.")
        setStep("input")
        return
      }
      setObjects(extracted)
      setStep("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed")
      setStep("input")
    }
  }

  function updateObject(index: number, field: keyof ImportObject, value: string) {
    setObjects((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value || null } : o))
    )
  }

  function removeObject(index: number) {
    setObjects((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleImport() {
    setStep("importing")
    setError(null)
    try {
      const res = await fetch(`/api/boards/${boardId}/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objects }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Import failed")
      setStep("done")
      setTimeout(() => {
        onImported(data.employees ?? [])
        onClose()
      }, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed")
      setStep("preview")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={step === "input" ? onClose : undefined} />

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Import {objectPlural}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Board: <span className="font-medium text-gray-600">{boardName}</span></p>
          </div>
          {step === "input" && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={28} className="text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-800">Imported {objects.length} {objects.length === 1 ? objectSingular : objectPlural}!</p>
            </div>
          )}

          {/* Extracting */}
          {step === "extracting" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                <Sparkles size={24} className="text-indigo-500 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-gray-600">Analyzing content with AI…</p>
              <p className="text-xs text-gray-400">This may take up to 15 seconds</p>
            </div>
          )}

          {/* Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-600">Saving {objects.length} {objects.length === 1 ? objectSingular.toLowerCase() : objectPlural.toLowerCase()}…</p>
            </div>
          )}

          {/* Input */}
          {step === "input" && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Upload size={22} className="text-gray-400" />
                </div>
                {fileName ? (
                  <p className="text-sm font-medium text-gray-700">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">Drop a file here</p>
                    <p className="text-xs text-gray-400">CSV, Excel, Word, PDF, or plain text</p>
                    <p className="text-xs text-gray-300">or click to browse</p>
                  </>
                )}
                <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.docx,.pdf,.txt" onChange={handleFileChange} />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or paste text</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Paste area */}
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Paste a list, table, or document containing ${objectPlural.toLowerCase()} here…`}
                rows={6}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-gray-700 placeholder:text-gray-300"
              />

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
          )}

          {/* Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Found <span className="text-indigo-600 font-semibold">{objects.length}</span> {objects.length === 1 ? objectSingular.toLowerCase() : objectPlural.toLowerCase()} — edit or remove before importing
                </p>
                <button
                  onClick={() => { setStep("input"); setError(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  ← Start over
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {visibleFields.map((f) => (
                        fieldLabels[f] && (
                          <th key={f} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {fieldLabels[f]}
                          </th>
                        )
                      ))}
                      <th className="w-8 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {objects.map((obj, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {visibleFields.map((f) =>
                          fieldLabels[f] ? (
                            <td key={f} className="px-2 py-1.5">
                              <input
                                type="text"
                                value={obj[f] ?? ""}
                                onChange={(e) => updateObject(i, f, e.target.value)}
                                className={`w-full bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 py-0.5 text-gray-700 min-w-0 ${
                                  f === "fullName" ? "font-medium" : "text-gray-500"
                                }`}
                                placeholder={f === "fullName" ? "Required" : "—"}
                              />
                            </td>
                          ) : null
                        )}
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => removeObject(i)}
                            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === "input" || step === "preview") && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>

            {step === "input" && (
              <button
                onClick={handleExtract}
                disabled={!pasteText.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} />
                Extract with AI
              </button>
            )}

            {step === "preview" && (
              <button
                onClick={handleImport}
                disabled={objects.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
              >
                <Check size={14} />
                Import {objects.length} {objects.length === 1 ? objectSingular : objectPlural}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
