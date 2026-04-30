export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: {
        "User-Agent": "PickyApp/1.0"
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.county;
      const neighbourhood = data.address.neighbourhood || data.address.suburb;
      
      if (neighbourhood && city) {
        return `${neighbourhood}, ${city}`;
      }
      return city || null;
    }
    return null;
  } catch (err) {
    console.error("Nominatim reverse geocode failed", err);
    return null;
  }
}
