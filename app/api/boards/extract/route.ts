import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const EXTRACT_PROMPT = `You are an onboarding data architect. Given a business document, extract employees and generate a complete onboarding program.

Available Snowflake tables you can query (use these to write verified test queries):
- SNOW_CERTIFIED.EMPLOYEE.DD_EMPLOYEE — columns: EMPLOYEE_EMAIL, EMPLOYEE_BUSINESS_TITLE, EMPLOYEE_MANAGER_NAME, EMPLOYEE_MANAGER_EMAIL, LEVEL_1_EMAIL, LEVEL_2_EMAIL, IS_EMPLOYEE_ACTIVE, EMPLOYEE_HIRE_DATE_AT
- SNOW_CERTIFIED.SALESFORCE_USER.DD_SALESFORCE_USER — columns: SALESFORCE_USER_EMAIL, SALESFORCE_USER_NAME, SALESFORCE_USER_ROLE_NAME, SALESFORCE_USER_TERRITORY_NAME, SALESFORCE_USER_TERRITORY_THEATER, SALESFORCE_USER_DIVISION, SALESFORCE_USER_DEPARTMENT, SALESFORCE_USER_MANAGER_NAME, IS_SALESFORCE_USER_FIVETRAN_DELETED
- SNOW_CERTIFIED.SALESFORCE_ETM.DS_ETM_TERRITORY_HIERARCHY — columns: SALESFORCE_TERRITORY_LABEL, SALESFORCE_TERRITORY_TYPE_STANDARDIZED, IS_LATEST_SNAPSHOT

Always use ':email' as the employee email placeholder in SQL. Always filter with LOWER(TRIM(col)) = LOWER(':email').

Return ONLY valid JSON, no explanation, in exactly this shape:
{
  "boardName": "string",
  "employees": [
    { "fullName": "string", "title": "string", "startDate": "string or null", "manager": "string or null", "territory": "string or null" }
  ],
  "phases": [
    {
      "key": "slug_no_spaces",
      "label": "string",
      "description": "string",
      "tasks": [
        {
          "key": "slug_no_spaces",
          "label": "string",
          "description": "string",
          "verifiedTestQuery": "SELECT ... FROM SNOW_CERTIFIED... WHERE LOWER(TRIM(col)) = LOWER(':email') -- or null if no query applies"
        }
      ]
    }
  ]
}

Generate 3-6 phases. Each phase should have 2-5 tasks. Write verifiedTestQuery for any task that can be verified against the Snowflake tables above (return null if no table applies).`

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text?.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    const truncated = (text as string).slice(0, 12000)
    const prompt = `${EXTRACT_PROMPT}\n\nDocument content:\n${truncated.replace(/\$\$/g, "$ $")}`

    const [row] = (await querySnowflake(`
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large2',
        $$${prompt}$$
      ) AS RESULT
    `)) as Array<{ RESULT: string }>

    const raw = row?.RESULT ?? ""

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI could not parse the document", raw }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)
  } catch (e) {
    console.error("[POST /api/boards/extract]", e)
    return Response.json({ error: e instanceof Error ? e.message : "Extraction failed" }, { status: 500 })
  }
}
