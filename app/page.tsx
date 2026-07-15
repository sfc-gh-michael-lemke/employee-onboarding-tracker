import { querySnowflake } from "@/lib/snowflake"
import { PHASES } from "@/lib/phases"
import { OnboardingApp } from "@/components/onboarding-app"

export const dynamic = "force-dynamic"

function getCurrentPhase(checklist: Record<string, Record<string, boolean>>): string {
  for (const phase of PHASES) {
    const allChecked = phase.items.every((item) => checklist[phase.key]?.[item.key] === true)
    if (!allChecked) return phase.key
  }
  return "done"
}

export default async function Page() {
  let employees: unknown[] = []
  let error: string | null = null

  try {
    const empRows = (await querySnowflake(`
      SELECT ID, FULL_NAME, TITLE, TO_VARCHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE,
             MANAGER, TERRITORY, NOTES, CREATED_AT
      FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
      ORDER BY CREATED_AT DESC
    `)) as Array<Record<string, string>>

    const checklistRows = (await querySnowflake(`
      SELECT EMPLOYEE_ID, PHASE_KEY, ITEM_KEY, IS_CHECKED
      FROM TEMP.MLEMKE.ONBOARDING_CHECKLIST
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
      return { ...emp, checklist: empChecklist, checkedCount, currentPhase: getCurrentPhase(empChecklist) }
    })
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data"
  }

  return <OnboardingApp initialEmployees={employees as Employee[]} initialError={error} />
}

export interface Employee {
  ID: string
  FULL_NAME: string
  TITLE: string
  START_DATE: string
  MANAGER: string
  TERRITORY: string
  NOTES: string
  EMAIL: string | null
  checklist: Record<string, Record<string, boolean>>
  checkedCount: number
  currentPhase: string
}
