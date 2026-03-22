import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addDays, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/trips — list all trips
export async function GET() {
  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          stops: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  return NextResponse.json(trips);
}

// POST /api/trips — create trip + auto-generate days
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    title,
    startDate,
    endDate,
    originName,
    originLat,
    originLng,
    originPlaceId,
    travelMode = "DRIVE",
    tripStyle = "EXPLORE",
  } = body;

  if (!title || !startDate || !endDate) {
    return NextResponse.json(
      { error: "title, startDate, endDate are required" },
      { status: 400 }
    );
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  if (totalDays < 1 || totalDays > 30) {
    return NextResponse.json(
      { error: "Trip must be between 1 and 30 days" },
      { status: 400 }
    );
  }

  const trip = await prisma.trip.create({
    data: {
      title,
      startDate: start,
      endDate: end,
      originName,
      originLat,
      originLng,
      originPlaceId,
      travelMode,
      tripStyle,
      days: {
        create: Array.from({ length: totalDays }, (_, i) => ({
          dayNumber: i + 1,
          date: addDays(start, i),
        })),
      },
    },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          stops: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  return NextResponse.json(trip, { status: 201 });
}
