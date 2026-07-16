import { querySnowflake } from "@/lib/snowflake"
import Link from "next/link"
import { BoardsGrid } from "@/components/boards-grid"

export const dynamic = "force-dynamic"

interface Board {
  ID: string
  NAME: string
  DESCRIPTION: string | null
  CREATED_AT: string
  EMPLOYEE_COUNT: number
}

export default async function AllBoardsPage() {
  let boards: Board[] = []
  let error: string | null = null

  try {
    boards = (await querySnowflake(`
      SELECT b.ID, b.NAME, b.DESCRIPTION, TO_VARCHAR(b.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT,
             COUNT(e.ID) AS EMPLOYEE_COUNT
      FROM TEMP.MLEMKE.ONBOARDING_BOARDS b
      LEFT JOIN TEMP.MLEMKE.ONBOARDING_EMPLOYEES e ON e.BOARD_ID = b.ID
      GROUP BY b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT
      ORDER BY b.CREATED_AT ASC
    `)) as Board[]
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load boards"
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">All Boards</h1>
        <Link
          href="/boards/new"
          className="px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Board
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {boards.length === 0 && !error ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">No boards yet</h2>
          <p className="text-sm text-gray-400 mb-5">Create your first board to start tracking a process.</p>
          <Link
            href="/boards/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Create first board
          </Link>
        </div>
      ) : (
        <BoardsGrid initialBoards={boards} />
      )}
    </main>
  )
}
