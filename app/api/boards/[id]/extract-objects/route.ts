import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const PROMPTS: Record<string, string> = {
  employee: `You are a data extractor. Given text containing people/employee information, extract a list of individuals.

Return ONLY valid JSON with this exact shape:
{
  "objects": [
    { "fullName": "string", "title": "string or null", "startDate": "YYYY-MM-DD or null", "manager": "string or null", "territory": "string or null", "notes": "string or null" }
  ]
}

Extract as many people as you can find. Use null for any fields not present.`,

  process: `You are a data extractor. Given text containing process or workflow information, extract a list of distinct processes.

Return ONLY valid JSON with this exact shape:
{
  "objects": [
    { "fullName": "string (process name)", "title": "string or null (owner/team)", "startDate": null, "manager": "string or null (stakeholder)", "territory": "string or null (business area)", "notes": "string or null (brief description)" }
  ]
}

Extract each distinct process as a separate item. Use null for fields not applicable.`,

  role_type: `You are a data extractor. Given text containing role or position information, extract a list of role types.

Return ONLY valid JSON with this exact shape:
{
  "objects": [
    { "fullName": "string (role name)", "title": "string or null (level/tier)", "startDate": null, "manager": "string or null (reporting to)", "territory": "string or null (department/function)", "notes": "string or null (brief description)" }
  ]
}

Extract each distinct role type as a separate item. Use null for fields not applicable.`,
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params // ensure params resolved (unused but required for Next.js route)
    const { text, objectType = "employee" } = await req.json()

    if (!text?.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    const prompt = PROMPTS[objectType] ?? PROMPTS.employee
    const truncated = (text as string).slice(0, 12000)
    const fullPrompt = `${prompt}\n\nContent:\n${truncated.replace(/\$\$/g, "$ $")}`

    const [row] = (await querySnowflake(`
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large2',
        $$${fullPrompt}$$
      ) AS RESULT
    `)) as Array<{ RESULT: string }>

    const raw = row?.RESULT ?? ""
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI could not extract objects from this content", raw }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Extraction failed" }, { status: 500 })
  }
}
