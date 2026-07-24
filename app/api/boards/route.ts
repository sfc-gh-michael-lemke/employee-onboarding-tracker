import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const archived = req.nextUrl.searchParams.get("archived") === "true"
    const rows = await querySnowflake(`
      SELECT b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT,
             COALESCE(b.IS_ARCHIVED, FALSE) AS IS_ARCHIVED,
             COALESCE(b.OBJECT_TYPE, 'employee') AS OBJECT_TYPE,
             COUNT(e.ID) AS EMPLOYEE_COUNT
      FROM TEMP.MLEMKE.ONBOARDING_BOARDS b
      LEFT JOIN TEMP.MLEMKE.ONBOARDING_EMPLOYEES e ON e.BOARD_ID = b.ID
      WHERE COALESCE(b.IS_ARCHIVED, FALSE) = ${archived ? "TRUE" : "FALSE"}
      GROUP BY b.ID, b.NAME, b.DESCRIPTION, b.CREATED_AT, b.IS_ARCHIVED, b.OBJECT_TYPE
      ORDER BY b.CREATED_AT ASC
    `)
    return Response.json(rows)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json()
    if (!name) return Response.json({ error: "name is required" }, { status: 400 })

    await querySnowflake(`
      INSERT INTO TEMP.MLEMKE.ONBOARDING_BOARDS (NAME, DESCRIPTION)
      VALUES (${sql(name)}, ${sql(description)})
    `)

    const [board] = (await querySnowflake(`
      SELECT ID, NAME, DESCRIPTION, CREATED_AT
      FROM TEMP.MLEMKE.ONBOARDING_BOARDS
      WHERE NAME = ${sql(name)}
      ORDER BY CREATED_AT DESC LIMIT 1
    `)) as Array<Record<string, string>>

    return Response.json(board, { status: 201 })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

function sql(v: string | undefined | null) {
  if (!v) return "NULL"
  return `'${v.replace(/'/g, "''")}'`
}
