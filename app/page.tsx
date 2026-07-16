import { querySnowflake } from "@/lib/snowflake"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface Board {
  ID: string
  NAME: string
  DESCRIPTION: string | null
  CREATED_AT: string
  EMPLOYEE_COUNT: number
}

export default async function BoardsHomePage() {
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
    <main className="px-6 py-12 max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Boards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Each board tracks a group of new hires through the onboarding process.
          </p>
        </div>
        <Link
          href="/boards/new"
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="text-center py-20 text-gray-400 text-sm">
          No boards yet.{" "}
          <Link href="/boards/new" className="text-blue-600 hover:underline">
            Create your first board
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <Link
              key={board.ID}
              href={`/boards/${board.ID}`}
              className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
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
          ))}
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500">
          <div>
            <div className="font-medium text-gray-700 mb-1">1. Create a board</div>
            Drop a hiring document (PDF, Excel, Word) and AI will extract employees and onboarding phases automatically.
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-1">2. Track progress</div>
            Each employee moves through phases as their checklist is completed. Watch their progress in real time.
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-1">3. Run checks</div>
            Verify onboarding milestones automatically using Snowflake data checks tied to each phase.
          </div>
        </div>
      </div>
    </main>
  )
}

// Keep Employee type exported for other pages that import it
export interface Employee {
  ID: string
  FULL_NAME: string
  TITLE: string
  START_DATE: string
  MANAGER: string
  TERRITORY: string
  NOTES: string
  EMAIL: string | null
  checklist: Record<string, Record<string, boolean>>
  checkedCount: number
  currentPhase: string
}
