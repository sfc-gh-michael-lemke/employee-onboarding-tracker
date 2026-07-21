import { querySnowflake } from "@/lib/snowflake"
import Link from "next/link"
import { BoardsPageClient } from "@/components/boards-page-client"

export const dynamic = "force-dynamic"

interface Board {
  ID: string
  NAME: string
  DESCRIPTION: string | null
  CREATED_AT: string
  EMPLOYEE_COUNT: number
  IS_ARCHIVED?: boolean
}

const BOARDS_QUERY = (archived: boolean) => `
  SELECT b.ID, b.NAME, b.DESCRIPTION, TO_VARCHAR(b.CREATED_AT, 'YYYY-MM-DD') AS CREATED_AT,
         COALESCE(b.IS_ARCHIVED, FALSE) AS IS_ARCHIVED,
         COUNT(e.ID) AS EMPLOYEE_COUNT
  FROM TEMP.MLEMKE.ONBOARDING_BOARDS b
  LEFT JOIN TEMP.MLEMKE.ONBOARDING_EMPLOYEES e ON e.BOARD_ID = b.ID
  WHERE COALESCE(b.IS_ARCHIVED, FALSE) = ${archived ? "TRUE" : "FALSE"}
  GROUP BY b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT, b.IS_ARCHIVED
  ORDER BY b.CREATED_AT ASC
`

export default async function AllBoardsPage() {
  let active: Board[] = []
  let archived: Board[] = []
  let error: string | null = null

  try {
    ;[active, archived] = await Promise.all([
      querySnowflake(BOARDS_QUERY(false)) as Promise<Board[]>,
      querySnowflake(BOARDS_QUERY(true)) as Promise<Board[]>,
    ])
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

      {!error && <BoardsPageClient initialActive={active} initialArchived={archived} />}
    </main>
  )
}
