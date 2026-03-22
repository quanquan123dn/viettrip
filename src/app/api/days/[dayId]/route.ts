import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/days/:dayId — update day notes & baseCityName
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;
  const body = await req.json();

  const day = await prisma.tripDay.update({
    where: { id: dayId },
    data: {
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.baseCityName !== undefined && { baseCityName: body.baseCityName }),
    },
  });

  return NextResponse.json(day);
}
