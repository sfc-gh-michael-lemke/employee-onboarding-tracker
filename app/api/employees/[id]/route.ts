import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"
import { PHASES } from "@/lib/phases"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [emp] = (await querySnowflake(`
      SELECT ID, FULL_NAME, TITLE, TO_VARCHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE,
             MANAGER, TERRITORY, NOTES
      FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
      WHERE ID = '${id.replace(/'/g, "''")}'
    `)) as Array<Record<string, string>>

    if (!emp) return Response.json({ error: "Not found" }, { status: 404 })

    const checklist = (await querySnowflake(`
      SELECT PHASE_KEY, ITEM_KEY, IS_CHECKED, CHECKED_AT, CHECKED_BY
      FROM TEMP.MLEMKE.ONBOARDING_CHECKLIST
      WHERE EMPLOYEE_ID = '${id.replace(/'/g, "''")}'
    `)) as Array<{ PHASE_KEY: string; ITEM_KEY: string; IS_CHECKED: boolean; CHECKED_AT: string; CHECKED_BY: string }>

    const checklistMap: Record<string, Record<string, boolean>> = {}
    for (const row of checklist) {
      if (!checklistMap[row.PHASE_KEY]) checklistMap[row.PHASE_KEY] = {}
      checklistMap[row.PHASE_KEY][row.ITEM_KEY] = row.IS_CHECKED
    }

    return Response.json({ ...emp, checklist: checklistMap })
  } catch (e) {
    console.error(new Date().toISOString(), "[GET /api/employees/[id]]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed to fetch employee" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    if ("notes" in body) {
      await querySnowflake(`
        UPDATE TEMP.MLEMKE.ONBOARDING_EMPLOYEES
        SET NOTES = ${sql(body.notes)}, UPDATED_AT = CURRENT_TIMESTAMP()
        WHERE ID = '${id.replace(/'/g, "''")}'
      `)
    }

    if ("phaseKey" in body && "itemKey" in body) {
      const isChecked = body.isChecked ? "TRUE" : "FALSE"
      const checkedAt = body.isChecked ? "CURRENT_TIMESTAMP()" : "NULL"
      await querySnowflake(`
        UPDATE TEMP.MLEMKE.ONBOARDING_CHECKLIST
        SET IS_CHECKED = ${isChecked}, CHECKED_AT = ${checkedAt}, UPDATED_AT = CURRENT_TIMESTAMP()
        WHERE EMPLOYEE_ID = '${id.replace(/'/g, "''")}' 
          AND PHASE_KEY = '${body.phaseKey.replace(/'/g, "''")}'
          AND ITEM_KEY = '${body.itemKey.replace(/'/g, "''")}'
      `)
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error(new Date().toISOString(), "[PATCH /api/employees/[id]]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed to update employee" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await querySnowflake(`DELETE FROM TEMP.MLEMKE.ONBOARDING_CHECKLIST WHERE EMPLOYEE_ID = '${id.replace(/'/g, "''")}'`)
    await querySnowflake(`DELETE FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES WHERE ID = '${id.replace(/'/g, "''")}'`)
    return Response.json({ ok: true })
  } catch (e) {
    console.error(new Date().toISOString(), "[DELETE /api/employees/[id]]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed to delete employee" }, { status: 500 })
  }
}

function sql(val: string | undefined | null): string {
  if (val === null || val === undefined || val === "") return "NULL"
  return `'${val.replace(/'/g, "''")}'`
}
