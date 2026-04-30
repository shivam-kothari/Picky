import { NextResponse } from "next/server";
import { fetchNearbyRestaurants, calculateDistance } from "@/lib/overpass";
import { reverseGeocode } from "@/lib/nominatim";
import { analyzeRestaurants } from "@/lib/gemini-restaurants";
import { getCriterionById } from "@/lib/criteria";
import type { RestaurantSearchRequest, RestaurantSearchResponse } from "@/lib/restaurants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RestaurantSearchRequest>;
    const { lat, lon, criteriaIds } = body;

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

    // 1. Try to get real restaurants from Overpass API
    let restaurants = await fetchNearbyRestaurants(lat, lon, 2500);
    
    // Sort by distance and cap at 100 to give Gemini a large, relevant pool
    if (restaurants.length > 0) {
      restaurants.sort((a, b) => {
        const distA = calculateDistance(lat, lon, a.lat, a.lon);
        const distB = calculateDistance(lat, lon, b.lat, b.lon);
        return distA - distB;
      });
      if (restaurants.length > 100) {
        restaurants = restaurants.slice(0, 100);
      }
    }

    // 2. If no restaurants found, fallback to getting location context for pure AI suggestions
    let locationContext: string | null = null;
    if (restaurants.length === 0) {
      locationContext = await reverseGeocode(lat, lon);
    }

    // 3. Ask Gemini to filter, recommend, and explain
    const results = await analyzeRestaurants({
      restaurants,
      locationContext,
      criteria,
    });

    const response: RestaurantSearchResponse = {
      restaurants: results,
      fallbackUsed: restaurants.length === 0,
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
