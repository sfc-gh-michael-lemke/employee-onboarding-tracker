"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, AlertTriangle, X, Archive, ArchiveRestore } from "lucide-react"

interface Board {
  ID: string
  NAME: string
  DESCRIPTION: string | null
  CREATED_AT: string
  EMPLOYEE_COUNT: number
  IS_ARCHIVED?: boolean
}

function DeleteModal({
  board,
  onConfirm,
  onCancel,
  loading,
}: {
  board: Board
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Delete &ldquo;{board.NAME}&rdquo;?</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              This will permanently delete the board
              {board.EMPLOYEE_COUNT > 0
                ? `, ${board.EMPLOYEE_COUNT} employee${board.EMPLOYEE_COUNT !== 1 ? "s" : ""}, their checklists,`
                : ""}{" "}
              and all phase configuration. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={13} />
                Delete board
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function BoardsGrid({
  initialBoards,
  archived = false,
  onArchiveToggle,
}: {
  initialBoards: Board[]
  archived?: boolean
  onArchiveToggle?: (id: string, nowArchived: boolean) => void
}) {
  const [boards, setBoards] = useState(initialBoards)
  const [confirmBoard, setConfirmBoard] = useState<Board | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState<string | null>(null)

  const handleDeleteConfirm = async () => {
    if (!confirmBoard) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/boards/${confirmBoard.ID}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      setBoards((prev) => prev.filter((b) => b.ID !== confirmBoard.ID))
      setConfirmBoard(null)
    } catch (err) {
      alert(`Failed to delete board: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleArchiveToggle = async (board: Board) => {
    const nowArchived = !board.IS_ARCHIVED
    setArchiving(board.ID)
    try {
      const res = await fetch(`/api/boards/${board.ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nowArchived }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setBoards((prev) => prev.filter((b) => b.ID !== board.ID))
      onArchiveToggle?.(board.ID, nowArchived)
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setArchiving(null)
    }
  }

  if (boards.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-4">
        {archived ? "No archived boards." : "No boards yet."}
      </p>
    )
  }

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${archived ? "opacity-70" : ""}`}>
        {boards.map((board) => (
          <div key={board.ID} className="relative group">
            {archived ? (
              /* Archived card — not clickable, muted */
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start justify-between mb-2 pr-14">
                  <h2 className="text-base font-semibold text-gray-500">{board.NAME}</h2>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 ml-2 shrink-0">
                    {board.EMPLOYEE_COUNT} {board.EMPLOYEE_COUNT === 1 ? "employee" : "employees"}
                  </span>
                </div>
                {board.DESCRIPTION && (
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">{board.DESCRIPTION}</p>
                )}
                <p className="text-xs text-gray-300">Created {board.CREATED_AT}</p>
              </div>
            ) : (
              /* Active card */
              <Link
                href={`/boards/${board.ID}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between mb-2 pr-14">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {board.NAME}
                  </h2>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 ml-2 shrink-0">
                    {board.EMPLOYEE_COUNT} {board.EMPLOYEE_COUNT === 1 ? "employee" : "employees"}
                  </span>
                </div>
                {board.DESCRIPTION && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{board.DESCRIPTION}</p>
                )}
                <p className="text-xs text-gray-400">Created {board.CREATED_AT}</p>
                <span className="inline-block mt-3 text-xs font-medium text-blue-600 group-hover:underline">
                  Open board →
                </span>
              </Link>
            )}

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
              {/* Archive / Restore */}
              <button
                onClick={(e) => { e.preventDefault(); handleArchiveToggle(board) }}
                disabled={archiving === board.ID}
                title={archived ? "Restore board" : "Archive board"}
                className={`p-1.5 rounded-md transition-all ${
                  archived
                    ? "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"
                    : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                } disabled:opacity-40`}
              >
                {archiving === board.ID ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                ) : archived ? (
                  <ArchiveRestore size={14} />
                ) : (
                  <Archive size={14} />
                )}
              </button>

              {/* Delete */}
              <button
                onClick={(e) => { e.preventDefault(); setConfirmBoard(board) }}
                title="Delete board"
                className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmBoard && (
        <DeleteModal
          board={confirmBoard}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setConfirmBoard(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
