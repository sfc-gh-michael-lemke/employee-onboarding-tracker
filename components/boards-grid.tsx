"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, AlertTriangle, X } from "lucide-react"

interface Board {
  ID: string
  NAME: string
  DESCRIPTION: string | null
  CREATED_AT: string
  EMPLOYEE_COUNT: number
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

export function BoardsGrid({ initialBoards }: { initialBoards: Board[] }) {
  const [boards, setBoards] = useState(initialBoards)
  const [confirmBoard, setConfirmBoard] = useState<Board | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  if (boards.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        No boards yet.{" "}
        <Link href="/boards/new" className="text-blue-600 hover:underline">
          Create your first board
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board) => (
          <div key={board.ID} className="relative group">
            <Link
              href={`/boards/${board.ID}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-2 pr-6">
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

            {/* Delete button */}
            <button
              onClick={(e) => { e.preventDefault(); setConfirmBoard(board) }}
              title="Delete board"
              className="absolute top-3 right-3 p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <Trash2 size={14} />
            </button>
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
