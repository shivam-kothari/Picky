export type RestaurantResult = {
  id: string;
  name: string;
  cuisine?: string;
  distanceMeters?: number;
  lat?: number;
  lon?: number;
  source: "osm" | "ai";
  matchSummary: string;
  cautions: string[];
  confidence: "high" | "medium" | "low";
};

export type RestaurantSearchRequest = {
  lat: number;
  lon: number;
  criteriaIds: string[];
  excludeIds?: string[];
  excludeNames?: string[];
};

export type RestaurantSearchResponse = {
  restaurants: RestaurantResult[];
  fallbackUsed: boolean;
};
