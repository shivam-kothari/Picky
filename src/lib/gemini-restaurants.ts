import type { Criterion } from "@/lib/criteria";
import type { OSMNode } from "@/lib/overpass";
import type { RestaurantResult } from "@/lib/restaurants";

type AnalyzeRestaurantsInput = {
  restaurants: OSMNode[];
  locationContext: string | null;
  criteria: Criterion[];
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
    const prompt = buildPrompt(restaurants, locationContext, criteria, isFallback);

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
            temperature: 0.1,
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
        // Find the original OSM node if it wasn't fallback
        const osmNode = isFallback ? null : restaurants.find((node) => node.id.toString() === String(r.id));
        
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
  isFallback: boolean
) {
  const policy = criteria.map((c) => ({
    label: c.label,
    rule: c.negativePrompt,
    cautions: c.hiddenRisks,
  }));

  let dataSection = "";
  if (isFallback) {
    dataSection = `The user is in or near: ${locationContext || "an unknown location"}.
Since we don't have a specific list of nearby restaurants, suggest up to 5 well-known restaurants or chains in that area that are very good at accommodating these specific dietary standards. If the location is unknown or vague, suggest global/national chains as examples. Generate a unique ID (like 'ai-1', 'ai-2') for each.`;
  } else {
    dataSection = `Here is a list of real restaurants near the user:
${restaurants
  .map((r) => `- ID: ${r.id} | Name: ${r.tags.name} | Cuisine: ${r.tags.cuisine || "Unknown"}`)
  .join("\n")}

Select the top 3-8 restaurants from this exact list that are most likely to accommodate the user's dietary standards. 
CRITICAL RULE: You are strictly forbidden from recommending any restaurant that is NOT explicitly on this list. If only 1 or 2 restaurants on this list are good matches, ONLY return those. You may return up to 8 if they are exceptionally good matches. Do not invent, guess, or hallucinate other restaurants. Only use the exact IDs provided.`;
  }

  return `
You are Double Check, a dietary restaurant advisor. Your job is to recommend the best dining options based on specific dietary restrictions.

USER DIETARY STANDARDS:
${JSON.stringify(policy, null, 2)}

${dataSection}

For each restaurant you select, provide:
1. "id": The exact ID provided in the list (or your generated one if no list was provided).
2. "name": The exact name.
3. "cuisine": The type of food they serve.
4. "matchSummary": A confident, concise (1-2 sentences) explanation of WHY this is a good choice for these specific standards. Mention what kind of dishes they can safely order.
5. "cautions": An array of 1-3 strings. Things they still need to watch out for based on the standards' cautions (e.g. "Ask if they use dedicated fryers", "Check if the sauce uses fish sauce").
6. "confidence": "high", "medium", or "low".

Return ONLY the JSON matching the schema.
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
