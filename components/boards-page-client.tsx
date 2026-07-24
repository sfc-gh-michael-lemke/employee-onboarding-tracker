"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { BoardsGrid } from "@/components/boards-grid"

interface Board {
  ID: string
  NAME: string
  DESCRIPTION: string | null
  CREATED_AT: string
  EMPLOYEE_COUNT: number
  IS_ARCHIVED?: boolean
  OBJECT_TYPE?: string
}

export function BoardsPageClient({
  initialActive,
  initialArchived,
}: {
  initialActive: Board[]
  initialArchived: Board[]
}) {
  const [active, setActive] = useState(initialActive)
  const [archived, setArchived] = useState(initialArchived)
  const [showArchived, setShowArchived] = useState(false)

  function handleArchiveToggle(id: string, nowArchived: boolean) {
    if (nowArchived) {
      // Move from active → archived
      const board = active.find((b) => b.ID === id)
      if (board) {
        setActive((prev) => prev.filter((b) => b.ID !== id))
        setArchived((prev) => [{ ...board, IS_ARCHIVED: true }, ...prev])
      }
    } else {
      // Move from archived → active
      const board = archived.find((b) => b.ID === id)
      if (board) {
        setArchived((prev) => prev.filter((b) => b.ID !== id))
        setActive((prev) => [...prev, { ...board, IS_ARCHIVED: false }])
      }
    }
  }

  return (
    <>
      {active.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">No active boards</h2>
          <p className="text-sm text-gray-400 mb-5">Create your first board to start tracking a process.</p>
          <Link
            href="/boards/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Create first board
          </Link>
        </div>
      ) : (
        <BoardsGrid initialBoards={active} onArchiveToggle={handleArchiveToggle} />
      )}

      {/* Archived section */}
      {archived.length > 0 && (
        <div className="mt-10 border-t border-gray-100 pt-6">
          <button
            onClick={() => setShowArchived((s) => !s)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            {showArchived ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            Archived
            <span className="ml-1 text-xs font-normal bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">
              {archived.length}
            </span>
          </button>
          {showArchived && (
            <BoardsGrid
              initialBoards={archived}
              archived
              onArchiveToggle={handleArchiveToggle}
            />
          )}
        </div>
      )}
    </>
  )
}
