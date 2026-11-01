/** Sorting places by how far away they are.
 *
 * Deliberately free of React Native imports so scripts/check_nearby.ts can
 * exercise it directly.
 */

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Kilometres between two points, along the surface of the earth (haversine). */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface Coordinates {
  latitude?: number;
  longitude?: number;
}

export function hasCoordinates(item?: Coordinates | null): boolean {
  return (
    !!item &&
    typeof item.latitude === "number" &&
    typeof item.longitude === "number" &&
    Number.isFinite(item.latitude) &&
    Number.isFinite(item.longitude)
  );
}

/** Kilometres from `from` to `item`, or undefined when either side has no coordinates. */
export function distanceKm(from: Coordinates | null | undefined, item: Coordinates | null | undefined): number | undefined {
  if (!hasCoordinates(from) || !hasCoordinates(item)) return undefined;
  return calculateDistance(from!.latitude!, from!.longitude!, item!.latitude!, item!.longitude!);
}

/**
 * Nearest first. Places with no coordinates keep to the end, in the order they
 * arrived, and the original list is left alone.
 *
 * Distances are measured once per item rather than inside the comparator: a
 * comparator that recomputes (and that answered "1" for every pair of unplaced
 * items) gave an order that depended on the starting arrangement.
 */
export function sortByDistance<T>(items: T[], from: Coordinates | null | undefined, coordinatesOf: (item: T) => Coordinates | undefined): T[] {
  if (!hasCoordinates(from)) return items;
  return items
    .map((item, index) => ({ item, index, km: distanceKm(from, coordinatesOf(item)) }))
    .sort((a, b) => {
      if (a.km === undefined && b.km === undefined) return a.index - b.index;
      if (a.km === undefined) return 1;
      if (b.km === undefined) return -1;
      // Same distance: keep the order the server sent, so the list doesn't shuffle.
      return a.km === b.km ? a.index - b.index : a.km - b.km;
    })
    .map((row) => row.item);
}

/** "450 m" under a kilometre, "2.4 km" up to ten, then "37 km". */
export function formatDistance(km?: number): string | undefined {
  if (km === undefined || !Number.isFinite(km)) return undefined;
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
