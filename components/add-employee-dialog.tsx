"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface FormData {
  fullName: string
  title: string
  startDate: string
  manager: string
  territory: string
  notes: string
}

export function AddEmployeeDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
}) {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    title: "",
    startDate: "",
    manager: "",
    territory: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Add New Hire</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <Field label="Full Name *" required>
            <input
              autoFocus
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Jane Smith"
              className="input"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Account Executive"
                className="input"
              />
            </Field>
            <Field label="Start Date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Manager">
              <input
                value={form.manager}
                onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
                placeholder="John Doe"
                className="input"
              />
            </Field>
            <Field label="Territory">
              <input
                value={form.territory}
                onChange={(e) => setForm((f) => ({ ...f, territory: e.target.value }))}
                placeholder="US West"
                className="input"
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional context…"
              rows={2}
              className="input resize-none"
            />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.fullName.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? "Adding…" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
