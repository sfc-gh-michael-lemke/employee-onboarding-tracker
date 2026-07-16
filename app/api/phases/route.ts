import { querySnowflake } from "@/lib/snowflake"
import { PHASES } from "@/lib/phases"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const boardId = new URL(req.url).searchParams.get("board_id")
    // null board_id → all; otherwise global (NULL) + board-specific rows
    const boardFilter = boardId
      ? `WHERE (BOARD_ID IS NULL OR BOARD_ID = '${boardId.replace(/'/g, "''")}')` : ""
    const overrides = (await querySnowflake(`
      SELECT PHASE_KEY, ITEM_KEY, LABEL, DESCRIPTION, VERIFIED_TEST_QUERY, IS_HIDDEN, BOARD_ID
      FROM TEMP.MLEMKE.PHASES_CONFIG
      ${boardFilter}
    `)) as Array<{
      PHASE_KEY: string
      ITEM_KEY: string | null
      LABEL: string | null
      DESCRIPTION: string | null
      VERIFIED_TEST_QUERY: string | null
      IS_HIDDEN: boolean | null
      BOARD_ID: string | null
    }>

    const phaseOverrides: Record<string, { label?: string; description?: string }> = {}
    const itemOverrides: Record<string, Record<string, { label?: string; description?: string; verifiedTestQuery?: string; hidden?: boolean }>> = {}

    for (const row of overrides) {
      if (!row.ITEM_KEY) {
        phaseOverrides[row.PHASE_KEY] = {
          ...(row.LABEL       ? { label: row.LABEL }             : {}),
          ...(row.DESCRIPTION ? { description: row.DESCRIPTION } : {}),
        }
      } else {
        if (!itemOverrides[row.PHASE_KEY]) itemOverrides[row.PHASE_KEY] = {}
        itemOverrides[row.PHASE_KEY][row.ITEM_KEY] = {
          ...(row.LABEL               ? { label: row.LABEL }                             : {}),
          ...(row.DESCRIPTION         ? { description: row.DESCRIPTION }                 : {}),
          ...(row.VERIFIED_TEST_QUERY ? { verifiedTestQuery: row.VERIFIED_TEST_QUERY }   : {}),
          ...(row.IS_HIDDEN           ? { hidden: true }                                 : {}),
        }
      }
    }

    const merged = PHASES.map(phase => ({
      ...phase,
      label:       phaseOverrides[phase.key]?.label       ?? phase.label,
      description: phaseOverrides[phase.key]?.description ?? phase.description,
      items: phase.items
        .map(item => ({
          ...item,
          label:              itemOverrides[phase.key]?.[item.key]?.label              ?? item.label,
          description:        itemOverrides[phase.key]?.[item.key]?.description        ?? item.description,
          verifiedTestQuery:  itemOverrides[phase.key]?.[item.key]?.verifiedTestQuery  ?? null,
          hidden:             itemOverrides[phase.key]?.[item.key]?.hidden             ?? false,
        }))
        .filter(item => !item.hidden),
    }))

    // Append custom phases/items from PHASES_CONFIG that are not in lib/phases.ts
    const staticPhaseKeys = new Set(PHASES.map(p => p.key))
    const staticItemKeys = new Set(PHASES.flatMap(p => p.items.map(i => `${p.key}/${i.key}`)))

    // Collect custom items grouped by phase_key
    const customItemsByPhase: Record<string, Array<{ key: string; label: string; description: string; verifiedTestQuery: string | null; hidden: boolean; links: [] }>> = {}
    for (const row of overrides) {
      if (!row.ITEM_KEY || row.IS_HIDDEN) continue
      const compositeKey = `${row.PHASE_KEY}/${row.ITEM_KEY}`
      if (staticItemKeys.has(compositeKey)) continue
      if (!customItemsByPhase[row.PHASE_KEY]) customItemsByPhase[row.PHASE_KEY] = []
      customItemsByPhase[row.PHASE_KEY].push({
        key: row.ITEM_KEY,
        label: row.LABEL || row.ITEM_KEY,
        description: row.DESCRIPTION || "",
        verifiedTestQuery: row.VERIFIED_TEST_QUERY || null,
        hidden: false,
        links: [] as [],
      })
    }

    // Append custom items to existing phases
    for (const phase of merged) {
      if (customItemsByPhase[phase.key]) {
        phase.items = [...phase.items, ...customItemsByPhase[phase.key]]
        delete customItemsByPhase[phase.key]
      }
    }

    // Append fully custom phases (phase_key not in lib/phases.ts)
    for (const [phaseKey, items] of Object.entries(customItemsByPhase)) {
      if (staticPhaseKeys.has(phaseKey)) continue
      const phaseRow = overrides.find(r => r.PHASE_KEY === phaseKey && !r.ITEM_KEY)
      merged.push({
        key: phaseKey,
        label: phaseRow?.LABEL || phaseKey,
        description: phaseRow?.DESCRIPTION || "",
        items,
        links: [],
      } as any)
    }
    // Also add custom phases that have a phase-level row but no items yet
    for (const row of overrides) {
      if (row.ITEM_KEY || row.IS_HIDDEN) continue
      if (staticPhaseKeys.has(row.PHASE_KEY)) continue
      if (merged.some(p => p.key === row.PHASE_KEY)) continue
      merged.push({
        key: row.PHASE_KEY,
        label: row.LABEL || row.PHASE_KEY,
        description: row.DESCRIPTION || "",
        items: [],
        links: [],
      } as any)
    }

    return Response.json(merged)
  } catch (e) {
    console.error("[GET /api/phases]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { phase_key, item_key, label, description, verified_test_query, hidden, board_id } = await req.json()
    if (!phase_key) return Response.json({ error: "phase_key required" }, { status: 400 })

    const pk  = esc(phase_key)
    const ik  = item_key              !== undefined ? (item_key              ? `'${esc(item_key)}'`              : "NULL") : "NULL"
    const lbl = label                 !== undefined ? (label                 ? `'${esc(label)}'`                 : "NULL") : "NULL"
    const dsc = description           !== undefined ? (description           ? `'${esc(description)}'`           : "NULL") : "NULL"
    const vtq = verified_test_query   !== undefined ? (verified_test_query   ? `'${esc(verified_test_query)}'`   : "NULL") : "NULL"
    const hid = hidden                !== undefined ? (hidden ? "TRUE" : "FALSE")                                          : "FALSE"
    const bid = board_id              !== undefined ? (board_id              ? `'${esc(board_id)}'`              : "NULL") : "NULL"

    await querySnowflake(`
      MERGE INTO TEMP.MLEMKE.PHASES_CONFIG AS tgt
      USING (SELECT '${pk}' AS PHASE_KEY, ${ik} AS ITEM_KEY, ${bid} AS BOARD_ID) AS src
        ON tgt.PHASE_KEY = src.PHASE_KEY
       AND (tgt.ITEM_KEY = src.ITEM_KEY OR (tgt.ITEM_KEY IS NULL AND src.ITEM_KEY IS NULL))
       AND (tgt.BOARD_ID = src.BOARD_ID OR (tgt.BOARD_ID IS NULL AND src.BOARD_ID IS NULL))
      WHEN MATCHED THEN UPDATE SET
        LABEL               = ${lbl},
        DESCRIPTION         = ${dsc},
        VERIFIED_TEST_QUERY = ${vtq},
        IS_HIDDEN           = ${hid},
        BOARD_ID            = ${bid},
        UPDATED_AT          = CURRENT_TIMESTAMP()
      WHEN NOT MATCHED THEN INSERT (PHASE_KEY, ITEM_KEY, LABEL, DESCRIPTION, VERIFIED_TEST_QUERY, IS_HIDDEN, BOARD_ID)
        VALUES ('${pk}', ${ik}, ${lbl}, ${dsc}, ${vtq}, ${hid}, ${bid})
    `)

    return Response.json({ ok: true })
  } catch (e) {
    console.error("[PATCH /api/phases]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

function esc(s: string) {
  return s.replace(/'/g, "''")
}
