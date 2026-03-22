import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/shared/:token — get trip by share token
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
  });

  if (!shareLink) {
    return NextResponse.json({ error: "Invalid share link" }, { status: 404 });
  }

  // Check expiry
  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }

  const trip = await prisma.trip.findUnique({
    where: { id: shareLink.tripId },
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

  return NextResponse.json({
    trip,
    permission: shareLink.permission,
  });
}
