import { querySnowflake } from "@/lib/snowflake"
import { PHASES } from "@/lib/phases"
import { OnboardingApp } from "@/components/onboarding-app"
import { notFound } from "next/navigation"
import type { Employee } from "@/app/page"

export const dynamic = "force-dynamic"

function getCurrentPhase(checklist: Record<string, Record<string, boolean>>): string {
  for (const phase of PHASES) {
    const allChecked = phase.items.every((item) => checklist[phase.key]?.[item.key] === true)
    if (!allChecked) return phase.key
  }
  return "done"
}

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let employees: Employee[] = []
  let error: string | null = null
  let boardName = ""

  try {
    const [board] = (await querySnowflake(`
      SELECT ID, NAME FROM TEMP.MLEMKE.ONBOARDING_BOARDS WHERE ID = '${id.replace(/'/g, "''")}'
    `)) as Array<{ ID: string; NAME: string }>

    if (!board) notFound()
    boardName = board.NAME

    const empRows = (await querySnowflake(`
      SELECT ID, FULL_NAME, TITLE, TO_VARCHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE,
             MANAGER, TERRITORY, NOTES, EMAIL, CREATED_AT
      FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
      WHERE BOARD_ID = '${id.replace(/'/g, "''")}'
      ORDER BY CREATED_AT DESC
    `)) as Array<Record<string, string>>

    const checklistRows = (await querySnowflake(`
      SELECT c.EMPLOYEE_ID, c.PHASE_KEY, c.ITEM_KEY, c.IS_CHECKED
      FROM TEMP.MLEMKE.ONBOARDING_CHECKLIST c
      INNER JOIN TEMP.MLEMKE.ONBOARDING_EMPLOYEES e ON e.ID = c.EMPLOYEE_ID
      WHERE e.BOARD_ID = '${id.replace(/'/g, "''")}'
    `)) as Array<{ EMPLOYEE_ID: string; PHASE_KEY: string; ITEM_KEY: string; IS_CHECKED: boolean }>

    const checklistMap: Record<string, Record<string, Record<string, boolean>>> = {}
    for (const row of checklistRows) {
      if (!checklistMap[row.EMPLOYEE_ID]) checklistMap[row.EMPLOYEE_ID] = {}
      if (!checklistMap[row.EMPLOYEE_ID][row.PHASE_KEY]) checklistMap[row.EMPLOYEE_ID][row.PHASE_KEY] = {}
      checklistMap[row.EMPLOYEE_ID][row.PHASE_KEY][row.ITEM_KEY] = row.IS_CHECKED
    }

    employees = empRows.map((emp) => {
      const empChecklist = checklistMap[emp.ID] ?? {}
      const checkedCount = Object.values(empChecklist).reduce(
        (sum, phase) => sum + Object.values(phase).filter(Boolean).length,
        0
      )
      return { ...emp, checklist: empChecklist, checkedCount, currentPhase: getCurrentPhase(empChecklist) } as Employee
    })
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data"
  }

  return <OnboardingApp initialEmployees={employees} initialError={error} boardId={id} boardName={boardName} />
}
