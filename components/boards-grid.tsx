"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2 } from "lucide-react"

interface Board {
  ID: string
  NAME: string
  DESCRIPTION: string | null
  CREATED_AT: string
  EMPLOYEE_COUNT: number
}

export function BoardsGrid({ initialBoards }: { initialBoards: Board[] }) {
  const [boards, setBoards] = useState(initialBoards)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, board: Board) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${board.NAME}"?\n\nThis will permanently remove the board, all ${board.EMPLOYEE_COUNT} employee${board.EMPLOYEE_COUNT !== 1 ? "s" : ""}, their checklists, and all phase configuration. This cannot be undone.`)) return

    setDeleting(board.ID)
    try {
      const res = await fetch(`/api/boards/${board.ID}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      setBoards((prev) => prev.filter((b) => b.ID !== board.ID))
    } catch (err) {
      alert(`Failed to delete board: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setDeleting(null)
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map((board) => {
        const isDeleting = deleting === board.ID
        return (
          <div key={board.ID} className="relative group">
            <Link
              href={`/boards/${board.ID}`}
              className={`block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
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

            {/* Delete button — shown on hover, positioned top-right */}
            <button
              onClick={(e) => handleDelete(e, board)}
              disabled={isDeleting}
              title="Delete board"
              className="absolute top-3 right-3 p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40 z-10"
            >
              {isDeleting ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
