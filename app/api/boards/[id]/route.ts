import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [board] = (await querySnowflake(`
      SELECT b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT,
             COUNT(e.ID) AS EMPLOYEE_COUNT
      FROM TEMP.MLEMKE.ONBOARDING_BOARDS b
      LEFT JOIN TEMP.MLEMKE.ONBOARDING_EMPLOYEES e ON e.BOARD_ID = b.ID
      WHERE b.ID = '${id.replace(/'/g, "''")}'
      GROUP BY b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT
    `)) as Array<Record<string, string>>

    if (!board) return Response.json({ error: "Not found" }, { status: 404 })
    return Response.json(board)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
