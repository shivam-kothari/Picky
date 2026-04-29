import type { Criterion } from "@/lib/criteria";
import {
  createVerifyVerdict,
  normalizeScanVerdict,
  scanVerdictResponseSchema,
  type ScanMimeType,
  type ScanVerdict,
} from "@/lib/scan";

type AnalyzeMenuImageInput = {
  imageBase64: string;
  mimeType: ScanMimeType;
  criteria: Criterion[];
};

type GeminiTextPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
    };
  }>;
};

const GEMINI_API_VERSION = "v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 22_000;

export async function analyzeMenuImage({
  imageBase64,
  mimeType,
  criteria,
}: AnalyzeMenuImageInput): Promise<ScanVerdict> {
  if (criteria.length === 0) {
    return createVerifyVerdict([], "Choose at least one standard before scanning.");
  }

  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return createVerifyVerdict(
      criteria,
      "Gemini is not configured yet. Add GEMINI_API_KEY to enable live menu intelligence."
    );
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = windowlessTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: buildScanPrompt(criteria) },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.0,
            topP: 0.1,
            topK: 1,
            responseMimeType: "application/json",
            responseSchema: scanVerdictResponseSchema,
          },
        }),
      }
    );

    if (!response.ok) {
      return createVerifyVerdict(
        criteria,
        `Gemini returned HTTP ${response.status}. Verify this dish manually.`
      );
    }

    const json = (await response.json()) as GeminiResponse;
    const text = json.candidates?.[0]?.content?.parts?.find((part) => part.text)
      ?.text;

    if (!text) {
      return createVerifyVerdict(
        criteria,
        "Gemini returned no structured verdict. Verify this dish manually."
      );
    }

    const parsed = parseGeminiJson(text);
    const verdict = normalizeScanVerdict(parsed, criteria);

    if (!verdict) {
      return createVerifyVerdict(
        criteria,
        "Gemini returned an invalid verdict shape. Verify this dish manually."
      );
    }



    return verdict;
  } catch {
    return createVerifyVerdict(
      criteria,
      "Double Check could not complete the live scan. Verify this dish manually."
    );
  } finally {
    clearTimeout(timeout);
  }
}

function buildScanPrompt(criteria: Criterion[]) {
  const policy = criteria.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    rule: criterion.negativePrompt,
    hiddenRisks: criterion.hiddenRisks,
    unsafeIfPresent: criterion.unsafeIfPresent,
    uncertainIfPossible: criterion.uncertainIfPossible,
  }));

  return `
You are Double Check, a precise dietary menu auditor. Your goal is to be genuinely useful — not just safe. An app that flags everything as "verify" is useless.

Analyze the attached menu image against the selected dietary standards.
Extract every food item from the menu sequentially (top to bottom, left to right).

## Core principle: Default to SAFE, escalate only on real evidence
- "SAFE" = the item, based on its name, description, and culinary context, plausibly complies with the selected standards. You do NOT need an explicit ingredient list to give a SAFE verdict. Use your knowledge of cuisines.
- "VETOED" = the item clearly violates a standard based on its name or description (e.g. "Chicken Tikka" is clearly not vegetarian).
- "VERIFY" = there is a SPECIFIC, GENUINE, PLAUSIBLE reason to doubt compliance that the user couldn't infer themselves. Do NOT use VERIFY as a default fallback.

## When to use VERIFY — be selective and specific:
- A sauce or preparation style that genuinely varies by restaurant (e.g. "Caesar dressing" sometimes contains anchovies).
- A dish whose name gives no indication of its ingredients (e.g. "Chef's Special", "House Sauce").
- A garnish or ingredient that is specifically known to hide the restricted item in that exact cuisine.

## When NOT to use VERIFY:
- Do NOT flag a dish just because you weren't shown a full ingredient list. Absence of a list is completely normal.
- Do NOT flag vegetarian dishes in an Indian restaurant for "possible meat stock" — Indian vegetarian cooking does not use meat stocks. Apply cultural culinary knowledge.
- Do NOT flag a clearly plant-based dish (e.g. "Dal Tadka", "Aloo Gobi", "Veg Fried Rice", "Palak Paneer") as VERIFY for meat.
- Do NOT flag a dish for a hidden risk that is implausible given the cuisine and the dish's description.

## Additional rules:
- If a dish name explicitly implies an ingredient (e.g. "Chicken Biryani" implies chicken), treat it as present.
- Be highly deterministic. Same menu = same output every time.
- Provide a brief, concise 'reason' for each item.
- Provide a high-level 'summary' of the entire menu.
- Return JSON only. No markdown.

Selected standards:
${JSON.stringify(policy, null, 2)}
`.trim();
}

function parseGeminiJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
}

function windowlessTimeout(callback: () => void, delay: number) {
  return setTimeout(callback, delay);
}
