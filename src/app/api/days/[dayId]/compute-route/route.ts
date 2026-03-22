import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeRoute } from "@/lib/maps/routes";
import { getCachedRoute, setCachedRoute, buildRouteCacheKey } from "@/lib/maps/cache";

export const dynamic = "force-dynamic";

// POST /api/days/:dayId/compute-route
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;
  const body = await req.json().catch(() => ({}));
  const forceRefresh = body.forceRefresh === true;

  // Get the day with stops and trip
  const day = await prisma.tripDay.findUnique({
    where: { id: dayId },
    include: {
      stops: { orderBy: { sortOrder: "asc" } },
      trip: true,
    },
  });

  if (!day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  if (day.stops.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 stops to compute route" },
      { status: 400 }
    );
  }

  const travelMode = day.trip.travelMode;
  const placeIds = day.stops.map((s) => `${s.lat},${s.lng}`);
  const cacheKey = buildRouteCacheKey(travelMode, placeIds);

  // Check cache
  if (!forceRefresh) {
    const cached = await getCachedRoute(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  // Compute route
  const waypoints = day.stops.map((s) => ({
    lat: s.lat,
    lng: s.lng,
    placeName: s.placeName,
  }));

  const routeResult = await computeRoute(waypoints, travelMode);

  if (!routeResult) {
    return NextResponse.json(
      { error: "Failed to compute route" },
      { status: 500 }
    );
  }

  // Cache the result
  await setCachedRoute(cacheKey, routeResult);

  // Save route snapshot
  await prisma.routeSnapshot.create({
    data: {
      tripDayId: dayId,
      totalDistanceMeters: routeResult.totalDistanceMeters,
      totalDurationSeconds: routeResult.totalDurationSeconds,
      encodedPolyline: routeResult.encodedPolyline,
      legsJson: JSON.stringify(routeResult.legs),
    },
  });

  return NextResponse.json(routeResult);
}
