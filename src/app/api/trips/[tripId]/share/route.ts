import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// GET /api/trips/:tripId/share — list share links
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;

  const links = await prisma.shareLink.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

// POST /api/trips/:tripId/share — create share link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const body = await req.json().catch(() => ({}));

  const permission = body.permission === "edit" ? "edit" : "view";

  // Optional expiry (default: 7 days)
  const expiresAt = body.expiresAt
    ? new Date(body.expiresAt)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = uuidv4().replace(/-/g, "").slice(0, 16);

  const link = await prisma.shareLink.create({
    data: {
      tripId,
      token,
      permission,
      expiresAt,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
