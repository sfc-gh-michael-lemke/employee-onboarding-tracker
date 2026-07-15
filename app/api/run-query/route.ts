import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { sql, email, user_id } = await req.json()
    if (!sql) return Response.json({ error: "sql required" }, { status: 400 })

    // Substitute :email and :user_id placeholders
    let resolved = sql
    if (email)   resolved = resolved.replace(/:email/gi,   email.replace(/'/g, "''"))
    if (user_id) resolved = resolved.replace(/:user_id/gi, user_id.replace(/'/g, "''"))

    const rows = await querySnowflake(resolved, { callersRights: true }) as Record<string, unknown>[]

    // Extract column names from first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    return Response.json({ columns, rows, count: rows.length })
  } catch (e) {
    console.error("[POST /api/run-query]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Query failed" },
      { status: 500 }
    )
  }
}
