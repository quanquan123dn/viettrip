import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/days/:dayId/reorder-stops
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;
  const { stopIds } = await req.json();

  if (!Array.isArray(stopIds)) {
    return NextResponse.json(
      { error: "stopIds array is required" },
      { status: 400 }
    );
  }

  // Update sort orders in a transaction
  await prisma.$transaction(
    stopIds.map((id: string, index: number) =>
      prisma.tripStop.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  // Return updated stops
  const stops = await prisma.tripStop.findMany({
    where: { tripDayId: dayId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(stops);
}
