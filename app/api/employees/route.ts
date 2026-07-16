import { querySnowflake } from "@/lib/snowflake"
import { PHASES } from "@/lib/phases"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const boardId = new URL(req.url).searchParams.get("board_id")
    const boardFilter = boardId ? `WHERE BOARD_ID = '${boardId.replace(/'/g, "''")}'` : ""
    const employees = await querySnowflake(`
      SELECT ID, FULL_NAME, TITLE, TO_VARCHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE, 
             MANAGER, TERRITORY, NOTES, EMAIL, BOARD_ID, CREATED_AT,
             COALESCE(CUSTOM_DATA, PARSE_JSON('{}')) AS CUSTOM_DATA
      FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
      ${boardFilter}
      ORDER BY CREATED_AT DESC
    `)

    const checklist = await querySnowflake(`
      SELECT EMPLOYEE_ID, PHASE_KEY, ITEM_KEY, IS_CHECKED
      FROM TEMP.MLEMKE.ONBOARDING_CHECKLIST
    `)

    const checklistMap: Record<string, Record<string, Record<string, boolean>>> = {}
    for (const row of checklist as Array<{ EMPLOYEE_ID: string; PHASE_KEY: string; ITEM_KEY: string; IS_CHECKED: boolean }>) {
      if (!checklistMap[row.EMPLOYEE_ID]) checklistMap[row.EMPLOYEE_ID] = {}
      if (!checklistMap[row.EMPLOYEE_ID][row.PHASE_KEY]) checklistMap[row.EMPLOYEE_ID][row.PHASE_KEY] = {}
      checklistMap[row.EMPLOYEE_ID][row.PHASE_KEY][row.ITEM_KEY] = row.IS_CHECKED
    }

    const result = (employees as Array<Record<string, string>>).map((emp) => {
      const empChecklist = checklistMap[emp.ID] ?? {}
      const checkedCount = Object.values(empChecklist).reduce(
        (sum, phase) => sum + Object.values(phase).filter(Boolean).length,
        0
      )
      const currentPhase = getCurrentPhase(empChecklist)
      return { ...emp, checklist: empChecklist, checkedCount, currentPhase }
    })

    return Response.json(result)
  } catch (e) {
    console.error(new Date().toISOString(), "[GET /api/employees]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed to fetch employees" }, { status: 500 })
  }
}

function getCurrentPhase(checklist: Record<string, Record<string, boolean>>): string {
  for (const phase of PHASES) {
    const allChecked = phase.items.every((item) => checklist[phase.key]?.[item.key] === true)
    if (!allChecked) return phase.key
  }
  return "done"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, title, startDate, manager, territory, notes, boardId } = body

    if (!fullName) return Response.json({ error: "fullName is required" }, { status: 400 })

    const [result] = (await querySnowflake(`
      INSERT INTO TEMP.MLEMKE.ONBOARDING_EMPLOYEES (FULL_NAME, EMAIL, TITLE, START_DATE, MANAGER, TERRITORY, NOTES, BOARD_ID)
      VALUES (${sql(fullName)}, ${sql(email)}, ${sql(title)}, ${sqlDate(startDate)}, ${sql(manager)}, ${sql(territory)}, ${sql(notes)}, ${sql(boardId)})
    `)) as Array<{ "number of rows inserted": number }>

    const [newEmp] = (await querySnowflake(`
      SELECT ID, FULL_NAME, TITLE, TO_VARCHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE,
             MANAGER, TERRITORY, NOTES, EMAIL
      FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
      WHERE FULL_NAME = ${sql(fullName)}
      ORDER BY CREATED_AT DESC
      LIMIT 1
    `)) as Array<Record<string, string>>

    // Initialize all checklist items
    const checklistValues = PHASES.flatMap((phase) =>
      phase.items.map((item) => `(${sql(newEmp.ID)}, '${phase.key}', '${item.key}', FALSE)`)
    ).join(", ")

    await querySnowflake(`
      INSERT INTO TEMP.MLEMKE.ONBOARDING_CHECKLIST (EMPLOYEE_ID, PHASE_KEY, ITEM_KEY, IS_CHECKED)
      VALUES ${checklistValues}
    `)

    return Response.json({ ...newEmp, checklist: {}, checkedCount: 0, currentPhase: "new_hire" }, { status: 201 })
  } catch (e) {
    console.error(new Date().toISOString(), "[POST /api/employees]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Failed to create employee" }, { status: 500 })
  }
}

function sql(val: string | undefined | null): string {
  if (val === null || val === undefined || val === "") return "NULL"
  return `'${val.replace(/'/g, "''")}'`
}

function sqlDate(val: string | undefined | null): string {
  if (!val) return "NULL"
  return `'${val}'::DATE`
}
