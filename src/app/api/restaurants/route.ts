import { NextResponse } from "next/server";
import { fetchNearbyRestaurants, calculateDistance } from "@/lib/overpass";
import { reverseGeocode } from "@/lib/nominatim";
import { analyzeRestaurants } from "@/lib/gemini-restaurants";
import { getCriterionById } from "@/lib/criteria";
import { preFilterRestaurants } from "@/lib/cuisine-filter";
import type { RestaurantSearchRequest, RestaurantSearchResponse } from "@/lib/restaurants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RestaurantSearchRequest>;
    const { lat, lon, criteriaIds, excludeIds = [], excludeNames = [] } = body;

    if (!lat || !lon || !criteriaIds || !Array.isArray(criteriaIds)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    if (criteriaIds.length === 0) {
      return NextResponse.json(
        { error: "No dietary criteria selected" },
        { status: 400 }
      );
    }

    // Map criteria IDs to actual Criterion objects
    const criteria = criteriaIds
      .map(getCriterionById)
      .filter((c) => c !== undefined);

    // 1. Get real restaurants from Overpass API
    let restaurants = await fetchNearbyRestaurants(lat, lon, 2500);
    
    if (excludeIds.length > 0) {
      restaurants = restaurants.filter(r => !excludeIds.includes(String(r.id)));
    }
    
    // Sort by distance (closest first)
    if (restaurants.length > 0) {
      restaurants.sort((a, b) => {
        const distA = calculateDistance(lat, lon, a.lat, a.lon);
        const distB = calculateDistance(lat, lon, b.lat, b.lon);
        return distA - distB;
      });
    }

    // 2. Pre-filter: remove obvious mismatches and prioritise likely matches.
    //    This dramatically reduces the token payload sent to Gemini.
    const { candidates, filteredOut } = preFilterRestaurants(restaurants, criteriaIds);
    console.log(`Pre-filter: ${restaurants.length} OSM → ${candidates.length} candidates (${filteredOut} eliminated)`);

    // 3. If no candidates remain, fallback to location context for AI suggestions
    let locationContext: string | null = null;
    if (candidates.length === 0) {
      locationContext = await reverseGeocode(lat, lon);
    }

    // 4. Ask Gemini to filter, recommend, and explain
    const results = await analyzeRestaurants({
      restaurants: candidates,
      locationContext,
      criteria,
      excludeNames,
    });

    const response: RestaurantSearchResponse = {
      restaurants: results,
      fallbackUsed: candidates.length === 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Restaurant search failed:", error);
    return NextResponse.json(
      { error: "Failed to find restaurants" },
      { status: 500 }
    );
  }
}
