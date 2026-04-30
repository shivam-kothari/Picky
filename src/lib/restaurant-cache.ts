import type { RestaurantSearchResponse } from "@/lib/restaurants";

const CACHE_KEY = "dc:restaurant-cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type CacheEntry = {
  key: string;
  data: RestaurantSearchResponse;
  timestamp: number;
};

type CacheStore = {
  entries: CacheEntry[];
};

/**
 * Generates a deterministic cache key from location + criteria.
 * Rounds lat/lon to ~100m precision so small GPS drift doesn't bust the cache.
 */
function makeCacheKey(lat: number, lon: number, criteriaIds: string[]): string {
  const roundedLat = Math.round(lat * 1000) / 1000; // ~111m precision
  const roundedLon = Math.round(lon * 1000) / 1000;
  const sortedCriteria = [...criteriaIds].sort().join(",");
  return `${roundedLat}:${roundedLon}:${sortedCriteria}`;
}

function loadStore(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { entries: [] };
    return JSON.parse(raw) as CacheStore;
  } catch {
    return { entries: [] };
  }
}

function saveStore(store: CacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}

/**
 * Look up a cached restaurant result. Returns null if not found or expired.
 */
export function getCachedRestaurants(
  lat: number,
  lon: number,
  criteriaIds: string[]
): RestaurantSearchResponse | null {
  const key = makeCacheKey(lat, lon, criteriaIds);
  const store = loadStore();
  const now = Date.now();

  const entry = store.entries.find((e) => e.key === key);
  if (!entry) return null;

  // Expired
  if (now - entry.timestamp > CACHE_TTL_MS) {
    // Clean up expired entry
    store.entries = store.entries.filter((e) => e.key !== key);
    saveStore(store);
    return null;
  }

  return entry.data;
}

/**
 * Store a restaurant result in cache.
 * Keeps max 5 entries to avoid filling localStorage.
 */
export function setCachedRestaurants(
  lat: number,
  lon: number,
  criteriaIds: string[],
  data: RestaurantSearchResponse
): void {
  const key = makeCacheKey(lat, lon, criteriaIds);
  const store = loadStore();
  const now = Date.now();

  // Remove any existing entry with same key, and any expired entries
  store.entries = store.entries.filter(
    (e) => e.key !== key && now - e.timestamp < CACHE_TTL_MS
  );

  // Add new entry
  store.entries.push({ key, data, timestamp: now });

  // Keep max 5 cached locations
  if (store.entries.length > 5) {
    store.entries = store.entries.slice(-5);
  }

  saveStore(store);
}
