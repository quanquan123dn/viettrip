import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchPlaceDetails } from "@/lib/maps/places";
import { getCachedPlace, setCachedPlace } from "@/lib/maps/cache";

export const dynamic = "force-dynamic";

// GET /api/places/:placeId — fetch + cache place details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;

  // Check cache first
  const cached = await getCachedPlace(placeId);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch from Google
  const place = await fetchPlaceDetails(placeId);

  if (!place) {
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 404 }
    );
  }

  // Cache it
  await setCachedPlace(placeId, place);

  return NextResponse.json(place);
}
