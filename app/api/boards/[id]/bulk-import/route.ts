import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

interface ImportObject {
  fullName: string
  title?: string | null
  startDate?: string | null
  manager?: string | null
  territory?: string | null
  notes?: string | null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const safeId = id.replace(/'/g, "''")
    const { objects } = (await req.json()) as { objects: ImportObject[] }

    if (!Array.isArray(objects) || objects.length === 0) {
      return Response.json({ error: "No objects to import" }, { status: 400 })
    }

    const sql = (v: string | null | undefined) => (v ? `'${v.replace(/'/g, "''")}'` : "NULL")

    const ids: string[] = []
    const rows = objects.map((o) => {
      const uid = randomUUID()
      ids.push(uid)
      return `('${uid}', ${sql(o.fullName)}, ${sql(o.title)}, ${sql(o.startDate)}, ${sql(o.manager)}, ${sql(o.territory)}, ${sql(o.notes)}, '${safeId}', CURRENT_TIMESTAMP())`
    })

    await querySnowflake(`
      INSERT INTO TEMP.MLEMKE.ONBOARDING_EMPLOYEES
        (ID, FULL_NAME, TITLE, START_DATE, MANAGER, TERRITORY, NOTES, BOARD_ID, CREATED_AT)
      VALUES
        ${rows.join(",\n        ")}
    `)

    // Return newly inserted rows for immediate UI update
    const inserted = (await querySnowflake(`
      SELECT ID, FULL_NAME, TITLE, TO_VARCHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE,
             MANAGER, TERRITORY, NOTES, EMAIL, CREATED_AT
      FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
      WHERE ID IN (${ids.map((i) => `'${i}'`).join(",")})
      ORDER BY CREATED_AT DESC
    `)) as Array<Record<string, string>>

    return Response.json({ ok: true, count: inserted.length, employees: inserted }, { status: 201 })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Bulk import failed" }, { status: 500 })
  }
}
