import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 120 // 2 min — warehouse may need to resume

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [board] = (await querySnowflake(`
      SELECT b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT,
             COALESCE(b.IS_ARCHIVED, FALSE) AS IS_ARCHIVED,
             COALESCE(b.OBJECT_TYPE, 'employee') AS OBJECT_TYPE,
             COUNT(e.ID) AS EMPLOYEE_COUNT
      FROM TEMP.MLEMKE.ONBOARDING_BOARDS b
      LEFT JOIN TEMP.MLEMKE.ONBOARDING_EMPLOYEES e ON e.BOARD_ID = b.ID
      WHERE b.ID = '${id.replace(/'/g, "''")}'
      GROUP BY b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT, b.IS_ARCHIVED, b.OBJECT_TYPE
    `)) as Array<Record<string, string>>

    if (!board) return Response.json({ error: "Not found" }, { status: 404 })
    return Response.json(board)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const safe = id.replace(/'/g, "''")
    const body = await req.json()
    const sets: string[] = []
    if ("archived" in body) sets.push(`IS_ARCHIVED = ${body.archived ? "TRUE" : "FALSE"}`)
    if ("object_type" in body && typeof body.object_type === "string") {
      const validTypes = ["employee", "process", "role_type"]
      if (!validTypes.includes(body.object_type)) throw new Error("Invalid object_type")
      sets.push(`OBJECT_TYPE = '${body.object_type}'`)
    }
    if (sets.length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 })
    await querySnowflake(`
      UPDATE TEMP.MLEMKE.ONBOARDING_BOARDS
      SET ${sets.join(", ")}
      WHERE ID = '${safe}'
    `)
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const safe = id.replace(/'/g, "''")

    // Single stored procedure call — all 4 cascade deletes run server-side
    await querySnowflake(`CALL TEMP.MLEMKE.DELETE_BOARD('${safe}')`)

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
