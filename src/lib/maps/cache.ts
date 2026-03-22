import { prisma } from "@/lib/db";

export async function getCachedPlace(placeId: string) {
  const cached = await prisma.placeCache.findUnique({
    where: { placeId },
  });

  if (!cached) return null;

  // Cache for 7 days
  const cacheAge = Date.now() - cached.updatedAt.getTime();
  if (cacheAge > 7 * 24 * 60 * 60 * 1000) return null;

  return JSON.parse(cached.placeJson);
}

export async function setCachedPlace(placeId: string, data: unknown) {
  await prisma.placeCache.upsert({
    where: { placeId },
    create: {
      placeId,
      placeJson: JSON.stringify(data),
    },
    update: {
      placeJson: JSON.stringify(data),
    },
  });
}

export async function getCachedRoute(cacheKey: string) {
  const cached = await prisma.routeCache.findUnique({
    where: { cacheKey },
  });

  if (!cached) return null;

  // Cache for 1 day
  const cacheAge = Date.now() - cached.updatedAt.getTime();
  if (cacheAge > 24 * 60 * 60 * 1000) return null;

  return JSON.parse(cached.responseJson);
}

export async function setCachedRoute(cacheKey: string, data: unknown) {
  await prisma.routeCache.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      responseJson: JSON.stringify(data),
    },
    update: {
      responseJson: JSON.stringify(data),
    },
  });
}

export function buildRouteCacheKey(
  travelMode: string,
  placeIds: string[]
): string {
  return `${travelMode}:${placeIds.join(",")}`;
}
