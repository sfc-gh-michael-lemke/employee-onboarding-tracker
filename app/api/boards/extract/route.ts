import { querySnowflake } from "@/lib/snowflake"
import type { NextRequest } from "next/server"

// pdf-parse uses DOMMatrix internally which doesn't exist in Node.js
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrix = class DOMMatrix {
    constructor(_init?: string | number[]) {}
    static fromMatrix() { return new (globalThis as any).DOMMatrix() }
    static fromFloat32Array() { return new (globalThis as any).DOMMatrix() }
    static fromFloat64Array() { return new (globalThis as any).DOMMatrix() }
  }
}

export const dynamic = "force-dynamic"
export const config = { api: { bodyParser: false } }

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

async function extractText(file: File): Promise<string> {
  const type = file.type
  const buffer = Buffer.from(await file.arrayBuffer())

  if (type === "text/csv" || file.name.endsWith(".csv")) {
    return buffer.toString("utf-8")
  }

  if (type === "application/pdf" || file.name.endsWith(".pdf")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse")
    const fn: (buf: Buffer) => Promise<{ text: string }> =
      typeof pdfParse === "function" ? pdfParse : pdfParse.default
    const result = await fn(buffer)
    return result.text
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value as string
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    type === "application/vnd.ms-excel" ||
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls")
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require("xlsx")
    const wb = XLSX.read(buffer, { type: "buffer" })
    return (wb.SheetNames as string[]).map((name: string) => {
      const ws = wb.Sheets[name]
      return XLSX.utils.sheet_to_csv(ws)
    }).join("\n\n")
  }

  // Fallback: try as plain text
  return buffer.toString("utf-8")
}

export async function POST(req: NextRequest) {
  try {
    let text = ""

    const contentType = req.headers.get("content-type") ?? ""

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file") as File | null
      const pastedText = form.get("text") as string | null

      if (pastedText?.trim()) {
        text = pastedText.trim()
      } else if (file) {
        text = await extractText(file)
      } else {
        return Response.json({ error: "No file or text provided" }, { status: 400 })
      }
    } else {
      const body = await req.json()
      text = body.text ?? ""
    }

    if (!text.trim()) {
      return Response.json({ error: "Could not extract text from document" }, { status: 400 })
    }

    // Truncate to avoid token limits (~12k chars)
    const truncated = text.slice(0, 12000)

    // Use $$ dollar-quoting so document content never breaks the SQL string
    const prompt = `${EXTRACT_PROMPT}\n\nDocument content:\n${truncated.replace(/\$\$/g, "$ $")}`

    const [row] = (await querySnowflake(`
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-large2',
        $$${prompt}$$
      ) AS RESULT
    `)) as Array<{ RESULT: string }>

    const raw = row?.RESULT ?? ""

    // Parse the JSON out of the model response
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
