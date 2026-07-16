import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const EXTRACT_PROMPT = `You are a data extraction assistant. Given the text content of a business document, extract:
1. A short suggested board name (e.g. "Q3 2026 AMS Cohort", "Sales EMEA Hires")
2. A list of employees/new hires mentioned (name, title, start_date in YYYY-MM-DD format if found, manager, territory)
3. A list of onboarding phases or milestones described in the document (label and a short description)

If employees or phases cannot be found, return empty arrays.

Return ONLY valid JSON, no explanation, in exactly this shape:
{
  "boardName": "string",
  "employees": [
    { "fullName": "string", "title": "string", "startDate": "string or null", "manager": "string or null", "territory": "string or null" }
  ],
  "phases": [
    { "key": "string (slug, no spaces)", "label": "string", "description": "string" }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text?.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    // Truncate to avoid token limits (~12k chars)
    const truncated = (text as string).slice(0, 12000)

    // Use $$ dollar-quoting so document content never breaks the SQL string
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
