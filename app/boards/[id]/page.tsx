import { querySnowflake } from "@/lib/snowflake"
import { PHASES } from "@/lib/phases"
import type { Phase } from "@/lib/phases"
import { OnboardingApp } from "@/components/onboarding-app"
import { notFound } from "next/navigation"
import type { Employee } from "@/app/page"
import { getObjectTypeInfo } from "@/lib/objectType"

export const dynamic = "force-dynamic"

function getCurrentPhase(
  checklist: Record<string, Record<string, boolean>>,
  phases: Phase[]
): string {
  for (const phase of phases) {
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
  let boardPhases: Phase[] = []
  let objectType = "employee"

  try {
    const [board] = (await querySnowflake(`
      SELECT ID, NAME, COALESCE(OBJECT_TYPE, 'employee') AS OBJECT_TYPE
      FROM TEMP.MLEMKE.ONBOARDING_BOARDS WHERE ID = '${id.replace(/'/g, "''")}'
    `)) as Array<{ ID: string; NAME: string; OBJECT_TYPE: string }>

    if (!board) notFound()
    boardName = board.NAME
    objectType = board.OBJECT_TYPE ?? "employee"

    const safeId = id.replace(/'/g, "''")

    const [empRows, checklistRows, phaseConfigRows] = await Promise.all([
      querySnowflake(`
        SELECT ID, FULL_NAME, TITLE, TO_VARCHAR(START_DATE, 'YYYY-MM-DD') AS START_DATE,
               MANAGER, TERRITORY, NOTES, EMAIL, CREATED_AT
        FROM TEMP.MLEMKE.ONBOARDING_EMPLOYEES
        WHERE BOARD_ID = '${safeId}'
        ORDER BY CREATED_AT DESC
      `) as Promise<Array<Record<string, string>>>,
      querySnowflake(`
        SELECT c.EMPLOYEE_ID, c.PHASE_KEY, c.ITEM_KEY, c.IS_CHECKED
        FROM TEMP.MLEMKE.ONBOARDING_CHECKLIST c
        INNER JOIN TEMP.MLEMKE.ONBOARDING_EMPLOYEES e ON e.ID = c.EMPLOYEE_ID
        WHERE e.BOARD_ID = '${safeId}'
      `) as Promise<Array<{ EMPLOYEE_ID: string; PHASE_KEY: string; ITEM_KEY: string; IS_CHECKED: boolean }>>,
      querySnowflake(`
        SELECT PHASE_KEY, ITEM_KEY, LABEL, DESCRIPTION
        FROM TEMP.MLEMKE.PHASES_CONFIG
        WHERE BOARD_ID = '${safeId}'
          AND COALESCE(IS_HIDDEN, FALSE) = FALSE
        ORDER BY PHASE_KEY, ITEM_KEY
      `) as Promise<Array<{ PHASE_KEY: string; ITEM_KEY: string; LABEL: string; DESCRIPTION: string }>>,
    ])

    // Build Phase[] from PHASES_CONFIG rows
    const phaseMap: Record<string, Phase> = {}
    for (const row of phaseConfigRows) {
      if (row.ITEM_KEY === "" || row.ITEM_KEY === null) {
        // Phase-level row
        if (!phaseMap[row.PHASE_KEY]) {
          phaseMap[row.PHASE_KEY] = {
            key: row.PHASE_KEY,
            label: row.LABEL ?? row.PHASE_KEY,
            description: row.DESCRIPTION ?? "",
            items: [],
          }
          boardPhases.push(phaseMap[row.PHASE_KEY])
        }
      } else {
        // Item-level row — ensure phase exists
        if (!phaseMap[row.PHASE_KEY]) {
          phaseMap[row.PHASE_KEY] = {
            key: row.PHASE_KEY,
            label: row.PHASE_KEY,
            description: "",
            items: [],
          }
          boardPhases.push(phaseMap[row.PHASE_KEY])
        }
        phaseMap[row.PHASE_KEY].items.push({
          key: row.ITEM_KEY,
          label: row.LABEL ?? row.ITEM_KEY,
          description: row.DESCRIPTION ?? "",
        })
      }
    }

    // Fall back to static phases if none found in DB
    const effectivePhases = boardPhases.length > 0 ? boardPhases : PHASES

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
      return { ...emp, checklist: empChecklist, checkedCount, currentPhase: getCurrentPhase(empChecklist, effectivePhases) } as Employee
    })
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data"
  }

  return (
    <OnboardingApp
      initialEmployees={employees}
      initialError={error}
      boardId={id}
      boardName={boardName}
      boardPhases={boardPhases.length > 0 ? boardPhases : undefined}
      objectType={objectType}
    />
  )
}
