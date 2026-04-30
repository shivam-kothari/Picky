import type { OSMNode } from "@/lib/overpass";

/**
 * Cuisine keywords that are strong negative signals per dietary criterion.
 * If a restaurant's cuisine tag contains any of these, it's very unlikely
 * to be a good match and can be dropped before sending to Gemini.
 */
const NEGATIVE_CUISINE_KEYWORDS: Record<string, string[]> = {
  vegan: [
    "steak", "steakhouse", "bbq", "barbecue", "grill", "burger", "wings",
    "fried_chicken", "seafood", "fish", "sushi", "meat", "churrasco",
  ],
  vegetarian: [
    "steak", "steakhouse", "bbq", "barbecue", "wings", "fried_chicken",
    "churrasco",
  ],
  "no-meat": [
    "steak", "steakhouse", "bbq", "barbecue", "wings", "fried_chicken",
    "churrasco",
  ],
  kosher: ["pork", "shellfish"],
  "no-shellfish": ["seafood", "shellfish", "oyster"],
  "no-peanuts": [],
  "no-dairy": [],
  "no-gluten": [],
  paleo: [],
  keto: [],
};

/**
 * Cuisine keywords that are strong positive signals per dietary criterion.
 * Restaurants with these tags are very likely to be good matches and should
 * be prioritised (placed first in the list sent to Gemini).
 */
const POSITIVE_CUISINE_KEYWORDS: Record<string, string[]> = {
  vegan: ["vegan", "vegetarian", "salad", "juice", "smoothie", "health_food"],
  vegetarian: [
    "vegetarian", "vegan", "indian", "pizza", "italian", "mexican",
    "thai", "chinese", "salad", "falafel", "mediterranean",
  ],
  "no-meat": [
    "vegetarian", "vegan", "indian", "pizza", "italian", "salad", "falafel",
  ],
  kosher: ["kosher", "israeli", "falafel", "mediterranean"],
  "no-shellfish": [],
  "no-peanuts": [],
  "no-dairy": [],
  "no-gluten": ["gluten_free"],
  paleo: ["grill", "steak", "seafood"],
  keto: ["grill", "steak", "seafood", "bbq"],
};

type FilterResult = {
  /** Restaurants to send to Gemini (prioritised, capped) */
  candidates: OSMNode[];
  /** How many were eliminated by the pre-filter */
  filteredOut: number;
};

/**
 * Pre-filters and prioritises the raw OSM restaurant list based on cuisine
 * tags vs. the user's active criteria. This runs BEFORE the Gemini call
 * to reduce the token payload significantly.
 *
 * Strategy:
 * 1. Remove restaurants whose cuisine is a strong negative signal for ALL active criteria.
 * 2. Boost restaurants whose cuisine is a strong positive signal for ANY active criterion.
 * 3. Keep "Unknown" cuisine restaurants — they might still be good matches.
 * 4. Cap the final list at `maxCandidates`.
 */
export function preFilterRestaurants(
  restaurants: OSMNode[],
  criteriaIds: string[],
  maxCandidates = 40,
): FilterResult {
  if (criteriaIds.length === 0 || restaurants.length === 0) {
    return { candidates: restaurants.slice(0, maxCandidates), filteredOut: 0 };
  }

  const positiveMatches: OSMNode[] = [];
  const neutralMatches: OSMNode[] = [];
  let filteredOut = 0;

  for (const r of restaurants) {
    const cuisine = (r.tags.cuisine || "").toLowerCase();

    // No cuisine tag → neutral (keep it, let Gemini decide based on name)
    if (!cuisine) {
      neutralMatches.push(r);
      continue;
    }

    // Check if the cuisine is a strong negative for ALL active criteria
    const isNegativeForAll = criteriaIds.every((cid) => {
      const negatives = NEGATIVE_CUISINE_KEYWORDS[cid] || [];
      return negatives.some((kw) => cuisine.includes(kw));
    });

    if (isNegativeForAll) {
      filteredOut++;
      continue;
    }

    // Check if the cuisine is a strong positive for ANY active criterion
    const isPositive = criteriaIds.some((cid) => {
      const positives = POSITIVE_CUISINE_KEYWORDS[cid] || [];
      return positives.some((kw) => cuisine.includes(kw));
    });

    if (isPositive) {
      positiveMatches.push(r);
    } else {
      neutralMatches.push(r);
    }
  }

  // Assemble: positives first, then neutrals, capped
  const candidates = [...positiveMatches, ...neutralMatches].slice(0, maxCandidates);

  return { candidates, filteredOut };
}
