import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/trips/:tripId — full trip with days + stops
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          stops: { orderBy: { sortOrder: "asc" } },
          routeSnapshots: {
            orderBy: { computedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json(trip);
}

// PATCH /api/trips/:tripId — update trip metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const body = await req.json();

  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.travelMode && { travelMode: body.travelMode }),
      ...(body.tripStyle && { tripStyle: body.tripStyle }),
      ...(body.status && { status: body.status }),
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

  return NextResponse.json(trip);
}

// DELETE /api/trips/:tripId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  await prisma.trip.delete({ where: { id: tripId } });

  return NextResponse.json({ success: true });
}
