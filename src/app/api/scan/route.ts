import { analyzeMenuImage } from "@/lib/gemini-scan";
import { createNoStandardsVerdict, validateScanRequest } from "@/lib/scan";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be JSON." }, { status: 400 });
  }

  const validated = validateScanRequest(body);
  if (!validated.ok) {
    return Response.json({ message: validated.message }, { status: validated.status });
  }

  if (validated.criteria.length === 0) {
    return Response.json(createNoStandardsVerdict());
  }

  const verdict = await analyzeMenuImage({
    imageBase64: validated.request.imageBase64,
    mimeType: validated.request.mimeType,
    criteria: validated.criteria,
  });

  return Response.json(verdict);
}
