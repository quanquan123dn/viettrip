export async function fetchPlaceDetails(placeId: string): Promise<{
  placeId: string;
  displayName: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_SERVER_KEY not set, returning mock data");
    return null;
  }

  const fieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.rating";

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=${fieldMask}&key=${apiKey}`,
    {
      headers: {
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,rating",
      },
    }
  );

  if (!res.ok) {
    console.error("Places API error:", await res.text());
    return null;
  }

  const data = await res.json();

  return {
    placeId: data.id || placeId,
    displayName: data.displayName?.text || "Unknown",
    formattedAddress: data.formattedAddress || "",
    lat: data.location?.latitude || 0,
    lng: data.location?.longitude || 0,
    rating: data.rating,
  };
}
