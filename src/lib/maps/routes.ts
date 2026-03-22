import type { RouteLeg } from "@/types";

interface RouteWaypoint {
  lat: number;
  lng: number;
  placeName: string;
}

export async function computeRoute(
  waypoints: RouteWaypoint[],
  travelMode: string = "DRIVE"
): Promise<{
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  encodedPolyline: string;
  legs: RouteLeg[];
} | null> {
  if (waypoints.length < 2) return null;

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_SERVER_KEY not set, returning mock route");
    return generateMockRoute(waypoints);
  }

  const origin = {
    location: {
      latLng: { latitude: waypoints[0].lat, longitude: waypoints[0].lng },
    },
  };

  const destination = {
    location: {
      latLng: {
        latitude: waypoints[waypoints.length - 1].lat,
        longitude: waypoints[waypoints.length - 1].lng,
      },
    },
  };

  const intermediates = waypoints.slice(1, -1).map((wp) => ({
    location: {
      latLng: { latitude: wp.lat, longitude: wp.lng },
    },
  }));

  const body: Record<string, unknown> = {
    origin,
    destination,
    travelMode: travelMode === "MOTORBIKE" ? "TWO_WHEELER" : "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
    languageCode: "vi",
    units: "METRIC",
  };

  if (intermediates.length > 0) {
    body.intermediates = intermediates;
  }

  const res = await fetch(
    `https://routes.googleapis.com/directions/v2:computeRoutes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    console.error("Routes API error:", await res.text());
    return generateMockRoute(waypoints);
  }

  const data = await res.json();
  const route = data.routes?.[0];

  if (!route) return generateMockRoute(waypoints);

  const legs: RouteLeg[] = (route.legs || []).map(
    (leg: { distanceMeters?: number; duration?: string }, i: number) => ({
      startPlaceName: waypoints[i]?.placeName || `Point ${i + 1}`,
      endPlaceName: waypoints[i + 1]?.placeName || `Point ${i + 2}`,
      distanceMeters: leg.distanceMeters || 0,
      durationSeconds: parseDuration(leg.duration || "0s"),
    })
  );

  return {
    totalDistanceMeters: route.distanceMeters || 0,
    totalDurationSeconds: parseDuration(route.duration || "0s"),
    encodedPolyline: route.polyline?.encodedPolyline || "",
    legs,
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)s/);
  return match ? parseInt(match[1], 10) : 0;
}

function generateMockRoute(waypoints: RouteWaypoint[]) {
  const legs: RouteLeg[] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = haversineDistance(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
    const distMeters = Math.round(dist * 1000);
    const durationSec = Math.round((dist / 40) * 3600); // ~40km/h avg

    legs.push({
      startPlaceName: waypoints[i].placeName,
      endPlaceName: waypoints[i + 1].placeName,
      distanceMeters: distMeters,
      durationSeconds: durationSec,
    });

    totalDistance += distMeters;
    totalDuration += durationSec;
  }

  return {
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDuration,
    encodedPolyline: "",
    legs,
  };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
