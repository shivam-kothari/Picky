import type { Criterion } from "@/lib/criteria";
import type { OSMNode } from "@/lib/overpass";
import type { RestaurantResult } from "@/lib/restaurants";

type AnalyzeRestaurantsInput = {
  restaurants: OSMNode[];
  locationContext: string | null;
  criteria: Criterion[];
  excludeNames?: string[];
};

const GEMINI_API_VERSION = "v1beta";
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 22_000;

const restaurantSchema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          cuisine: { type: "string" },
          matchSummary: { type: "string" },
          cautions: {
            type: "array",
            items: { type: "string" },
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["id", "name", "matchSummary", "cautions", "confidence"],
      },
    },
  },
  required: ["results"],
};

export async function analyzeRestaurants({
  restaurants,
  locationContext,
  criteria,
  excludeNames = [],
}: AnalyzeRestaurantsInput): Promise<RestaurantResult[]> {
  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const isFallback = restaurants.length === 0;
    const prompt = buildPrompt(restaurants, locationContext, criteria, isFallback, excludeNames);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
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
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.0,
            responseMimeType: "application/json",
            responseSchema: restaurantSchema,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText);
      return [];
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.find((part: Record<string, unknown>) => typeof part.text === 'string')?.text;

    if (!text) {
      return [];
    }

    const parsed = parseGeminiJson(text) as { results: Record<string, unknown>[] };
    
    // Map back to our format and filter out any hallucinations
    const validResults = parsed.results
      .map((r: Record<string, unknown>) => {
        // Match by exact ID, or fallback to exact name if Gemini reformatted the ID
        const osmNode = isFallback 
          ? null 
          : restaurants.find((node) => 
              node.id.toString() === String(r.id) || 
              (node.tags.name && r.name && node.tags.name.toLowerCase() === String(r.name).toLowerCase())
            );
        
        // If it's not a fallback and we can't find the OSM node, Gemini hallucinated it. Drop it.
        if (!isFallback && !osmNode) {
          console.warn(`Filtered out hallucinated restaurant: ${r.name} (ID: ${r.id})`);
          return null;
        }
        
        return {
          id: String(r.id),
          name: String(r.name),
          cuisine: r.cuisine ? String(r.cuisine) : (osmNode?.tags?.cuisine) || "Various",
          lat: osmNode?.lat,
          lon: osmNode?.lon,
          source: isFallback ? "ai" : "osm",
          matchSummary: String(r.matchSummary),
          cautions: Array.isArray(r.cautions) ? r.cautions.map(String) : [],
          confidence: r.confidence as "high" | "medium" | "low",
        } as RestaurantResult;
      })
      .filter((r): r is RestaurantResult => r !== null);

    return validResults;
  } catch (err) {
    console.error("Failed to analyze restaurants", err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(
  restaurants: OSMNode[],
  locationContext: string | null,
  criteria: Criterion[],
  isFallback: boolean,
  excludeNames: string[]
) {
  // Compact criteria: only label + core rule (no hiddenRisks — those are for menu scanning, not restaurant picking)
  const policy = criteria.map((c) => `${c.label}: ${c.negativePrompt}`).join("\n");
  const excludeText = excludeNames.length > 0 ? `\nDO NOT recommend these restaurants: ${excludeNames.join(", ")}` : "";

  let dataSection = "";
  if (isFallback) {
    dataSection = `Location: ${locationContext || "unknown"}. No nearby list available. Suggest up to 5 well-known restaurants or chains in that area suited to these standards.${excludeText}\nGenerate IDs like ai-1, ai-2.`;
  } else {
    const lines = restaurants.map(
      (r) => `${r.id}|${r.tags.name}|${r.tags.cuisine || "?"}`
    );

    dataSection = `Nearby restaurants (id|name|cuisine):\n${lines.join("\n")}\n\nYou MUST pick the top 3-8 best matches from this list. Even if none are perfect, you MUST recommend the most adaptable options. Use ONLY these exact IDs. If a cuisine is "?", infer from the name. Do not invent restaurants not on this list.${excludeText}`;
  }

  return `Dietary restaurant advisor. Recommend dining options matching these standards.

STANDARDS:
${policy}

${dataSection}

Per result: id, name, cuisine, matchSummary (1-2 sentences why it's good), cautions (1-3 things to verify), confidence (high/medium/low). JSON only. You must return at least 3 results.`;
}

function parseGeminiJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
}
