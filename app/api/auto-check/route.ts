import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { email, phase_key, item_key } = await req.json()
    if (!email || !phase_key || !item_key) {
      return Response.json({ error: "email, phase_key and item_key required" }, { status: 400 })
    }

    // Find employee by email
    const [emp] = (await querySnowflake(`
      SELECT ID FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
      WHERE LOWER(TRIM(EMAIL)) = LOWER('${email.replace(/'/g, "''")}')
      LIMIT 1
    `)) as Array<{ ID: string }>

    if (!emp) {
      return Response.json({ ok: false, reason: "no_employee", message: `No employee found with email ${email}` })
    }

    // Check if item exists and current state
    const [row] = (await querySnowflake(`
      SELECT IS_CHECKED FROM TEMP.MLEMKE.ONBOARDING_CHECKLIST
      WHERE EMPLOYEE_ID = '${emp.ID}'
        AND PHASE_KEY    = '${phase_key.replace(/'/g, "''")}'
        AND ITEM_KEY     = '${item_key.replace(/'/g, "''")}'
    `)) as Array<{ IS_CHECKED: boolean }>

    if (!row) {
      return Response.json({ ok: false, reason: "no_checklist_row", message: "Checklist row not found for this employee" })
    }

    if (row.IS_CHECKED) {
      return Response.json({ ok: true, reason: "already_checked", message: "Already checked" })
    }

    // Mark as checked
    await querySnowflake(`
      UPDATE TEMP.MLEMKE.ONBOARDING_CHECKLIST
      SET IS_CHECKED  = TRUE,
          CHECKED_AT  = CURRENT_TIMESTAMP(),
          UPDATED_AT  = CURRENT_TIMESTAMP()
      WHERE EMPLOYEE_ID = '${emp.ID}'
        AND PHASE_KEY    = '${phase_key.replace(/'/g, "''")}'
        AND ITEM_KEY     = '${item_key.replace(/'/g, "''")}'
    `)

    return Response.json({ ok: true, reason: "checked", employee_id: emp.ID, message: "Checked ✓" })
  } catch (e) {
    console.error("[POST /api/auto-check]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
