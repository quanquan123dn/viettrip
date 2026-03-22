import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/stops/:stopId — update stop
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ stopId: string }> }
) {
  const { stopId } = await params;
  const body = await req.json();

  const stop = await prisma.tripStop.update({
    where: { id: stopId },
    data: {
      ...(body.placeName !== undefined && { placeName: body.placeName }),
      ...(body.startTime !== undefined && { startTime: body.startTime }),
      ...(body.durationMinutes !== undefined && { durationMinutes: body.durationMinutes }),
      ...(body.note !== undefined && { note: body.note }),
      ...(body.estimatedCost !== undefined && { estimatedCost: body.estimatedCost }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });

  return NextResponse.json(stop);
}

// DELETE /api/stops/:stopId — delete stop
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ stopId: string }> }
) {
  const { stopId } = await params;

  await prisma.tripStop.delete({ where: { id: stopId } });

  return NextResponse.json({ success: true });
}
