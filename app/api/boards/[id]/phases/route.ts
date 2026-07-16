import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

interface Task {
  key: string
  label: string
  description?: string
  verifiedTestQuery?: string | null
}
interface Phase {
  key: string
  label: string
  description?: string
  tasks?: Task[]
}

// Single-request bulk insert for all phases + tasks on a new board
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { phases } = (await req.json()) as { phases: Phase[] }

    if (!Array.isArray(phases) || phases.length === 0) {
      return Response.json({ ok: true, inserted: 0 })
    }

    const bid = id.replace(/'/g, "''")

    // Build all value tuples in one pass
    const values: string[] = []
    for (const p of phases) {
      if (!p.key || !p.label) continue
      const pk = p.key.replace(/'/g, "''")
      const pl = (p.label || "").replace(/'/g, "''")
      const pd = (p.description || "").replace(/'/g, "''")
      // Phase header row ('' sentinel for ITEM_KEY)
      values.push(`('${pk}', '', '${pl}', '${pd}', NULL, '${bid}')`)
      for (const t of p.tasks ?? []) {
        if (!t.key || !t.label) continue
        const tk = t.key.replace(/'/g, "''")
        const tl = (t.label || "").replace(/'/g, "''")
        const td = (t.description || "").replace(/'/g, "''")
        const tv = t.verifiedTestQuery
          ? `'${t.verifiedTestQuery.replace(/'/g, "''")}'`
          : "NULL"
        values.push(`('${pk}', '${tk}', '${tl}', '${td}', ${tv}, '${bid}')`)
      }
    }

    if (values.length === 0) return Response.json({ ok: true, inserted: 0 })

    await querySnowflake(`
      INSERT INTO TEMP.MLEMKE.PHASES_CONFIG
        (PHASE_KEY, ITEM_KEY, LABEL, DESCRIPTION, VERIFIED_TEST_QUERY, BOARD_ID)
      VALUES ${values.join(",\n")}
    `)

    return Response.json({ ok: true, inserted: values.length })
  } catch (e) {
    console.error("[POST /api/boards/[id]/phases]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
