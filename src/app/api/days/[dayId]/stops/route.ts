import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/days/:dayId/stops — add stop to day
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;
  const body = await req.json();

  const { placeName, placeId, address, lat, lng, startTime, durationMinutes, note, estimatedCost, category, priority } = body;

  if (!placeName || lat === undefined || lng === undefined) {
    return NextResponse.json(
      { error: "placeName, lat, lng are required" },
      { status: 400 }
    );
  }

  // Get current max sortOrder
  const maxStop = await prisma.tripStop.findFirst({
    where: { tripDayId: dayId },
    orderBy: { sortOrder: "desc" },
  });

  const stop = await prisma.tripStop.create({
    data: {
      tripDayId: dayId,
      sortOrder: (maxStop?.sortOrder ?? -1) + 1,
      placeName,
      placeId,
      address,
      lat,
      lng,
      startTime,
      durationMinutes: durationMinutes || 60,
      note,
      estimatedCost,
      category,
      priority: priority || 3,
    },
  });

  return NextResponse.json(stop, { status: 201 });
}
