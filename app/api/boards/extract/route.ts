import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const EXTRACT_PROMPT = `You are an onboarding data architect. Given a business document, extract employees and generate a concise onboarding program structure.

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
        { "key": "slug_no_spaces", "label": "string", "description": "string" }
      ]
    }
  ]
}

Generate 3-6 phases. Each phase should have 2-5 tasks with clear labels and descriptions. Do NOT generate SQL — test queries can be added later.`

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
