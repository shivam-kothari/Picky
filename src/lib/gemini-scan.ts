import type { Criterion } from "@/lib/criteria";
import {
  createVerifyVerdict,
  normalizeScanVerdict,
  scanVerdictResponseSchema,
  type ScanMimeType,
  type ScanVerdict,
} from "@/lib/scan";
import { fetchWithRetry } from "@/lib/retry";

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
    const response = await fetchWithRetry(
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
      },
      { label: "Gemini Menu Scan" }
    );

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
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    return createVerifyVerdict(
      criteria,
      msg.startsWith("HTTP") 
        ? `Gemini returned ${msg}. Verify this dish manually.` 
        : "Double Check could not complete the live scan. Verify this dish manually."
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
    // These are signals to LOOK FOR on the menu, not assumptions to make
    menuSignalsToWatch: criterion.hiddenRisks,
    definiteViolations: criterion.unsafeIfPresent,
  }));

  return `
You are Double Check, a dietary menu analyst with deep culinary expertise. Your job is to be genuinely useful — an accurate advisor, not a paranoid gatekeeper.

Analyze the attached menu image. Extract every food item sequentially (top to bottom, left to right).

---

## YOUR MOST IMPORTANT INSTRUCTION: Use your culinary knowledge as evidence

You have encyclopedic knowledge of world cuisines and how dishes are made. This knowledge is VALID EVIDENCE. You are not limited to only what is explicitly written on the menu.

- You know that "Dal Tadka" is lentils simmered with spices. You know that "Pad Thai" can contain fish sauce. You know "Caesar dressing" typically contains anchovies. You know "Wiener Schnitzel" is veal. Use this knowledge.
- A menu not listing every ingredient is completely normal. The absence of an ingredient list is NOT a reason to give a VERIFY verdict.

---

## How to assign status

**SAFE** — Use this when:
- The dish's standard composition (based on its name and your culinary knowledge) is compatible with the selected standards, AND
- Nothing on the menu description contradicts this.
- You do NOT need an explicit ingredient list. Your knowledge of how the dish is made is sufficient.

**VETOED** — Use this when:
- The dish clearly contains a forbidden ingredient, either stated in the menu, or universally present in its standard preparation (e.g. "Beef Burger" contains meat; "Lobster Bisque" contains shellfish).

**VERIFY** — Use this ONLY when one of these three specific conditions is true:
1. **Genuinely unknown composition**: The dish name gives you no usable information about its ingredients (e.g. "Chef's Special," "House Sauce," "Mystery Bowl," "Signature Dish").
2. **A known culinary signal is visible on the menu**: You can see specific text — a preparation method, a listed ingredient, or a section header — that genuinely suggests a restricted ingredient may be present. For example: "cooked in shared fryer," "dashi broth," "Worcestershire sauce," "Caesar dressing," "bacon bits optional."
3. **The dish is a well-known culinary edge case for that specific standard**: For example, Pad Thai for No-Shellfish (fish sauce is standard but varies), or a "vegetable soup" at a French restaurant for No-Meat (French cuisine routinely uses fond de veau in vegetable dishes).

**NEVER use VERIFY because:**
- The menu didn't provide a full ingredient list (this is always the case — it proves nothing).
- A hidden risk is theoretically *possible* but there is no specific evidence pointing to it.
- The dish is clearly plant-based but you're worried about something invisible and unspecified.
- You're uncertain and want to be safe — if there's no specific reason to doubt, default to SAFE.

---

## Cultural calibration examples

- **Indian vegetarian dishes** (Dal, Sabzi, Chaat, Paneer dishes, Biryani labeled vegetarian): Indian vegetarian cuisine does not use meat stocks. Do not flag for hidden meat. Flag paneer dishes for No-Dairy.
- **Italian pasta / pizza**: Flag for No-Gluten. Cheese dishes flag for No-Dairy/Vegan. Straightforward.
- **French cuisine**: Stocks and butter are common — flag sauces and soups for No-Meat/Vegan/No-Dairy more readily. This is a cuisine where VERIFY is more warranted for hidden stocks.
- **Mexican / Tex-Mex**: Refried beans sometimes use lard — a legitimate VERIFY for Vegetarian/Vegan. Tacos al Pastor contain pork — clear VETOED for No-Meat.
- **Southeast Asian**: Fish sauce and shrimp paste are common hidden ingredients — a legitimate VERIFY for No-Shellfish/Vegan in Thai, Vietnamese, and Indonesian dishes.
- **Japanese**: Dashi (fish stock) is common in soups, noodles, and sauces — legitimate VERIFY for No-Shellfish/Vegetarian in Japanese dishes that involve broth.

---

## Final instructions
- Be highly deterministic. Same menu = same output every time.
- Provide a brief, specific 'reason' for each item that tells the user something useful.
- Provide a high-level 'summary' of the entire menu scan.
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
