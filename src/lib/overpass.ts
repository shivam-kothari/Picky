export type OSMNode = {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    cuisine?: string;
    [key: string]: string | undefined;
  };
};

export async function fetchNearbyRestaurants(lat: number, lon: number, radiusMeters = 2000): Promise<OSMNode[]> {
  const query = `
    [out:json][timeout:10];
    (
      nwr["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
      nwr["amenity"="cafe"]["food"="yes"](around:${radiusMeters},${lat},${lon});
      nwr["amenity"="fast_food"](around:${radiusMeters},${lat},${lon});
    );
    out center limit 150;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!response.ok) {
      console.error("Overpass API error", response.statusText);
      return [];
    }

    const data = await response.json();
    
    // Filter to only those with a name and coordinate
    const validElements = (data.elements || []).filter((el: any) => {
      return el.tags && el.tags.name && (el.lat || el.center?.lat);
    });
    
    return validElements.map((el: any) => ({
      id: el.id,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon,
      tags: el.tags
    })) as OSMNode[];
  } catch (err) {
    console.error("Failed to fetch from Overpass API", err);
    return [];
  }
}

// Haversine formula to calculate distance
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c); // in metres
}
