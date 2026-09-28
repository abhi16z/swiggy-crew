import type { TripBundle } from '@/components/trip-card';
import { KIND_BADGES } from '@/components/trip-card/constants';

import type { AppliedFilters, TripSort } from './types';

function isTripBundle(value: unknown): value is TripBundle {
  if (typeof value !== 'object' || value === null) return false;
  const { id, kind } = value as { id?: unknown; kind?: unknown };
  return typeof id === 'string' && typeof kind === 'string' && kind in KIND_BADGES;
}

/**
 * The trips in a `travel-bundles.json` payload. A trip type this build does not know is
 * dropped: it has no badge, filter card or count yet.
 */
export function parseTrips(data: unknown): TripBundle[] {
  return Array.isArray(data) ? data.filter(isTripBundle) : [];
}

export function formatTripCount(count: number) {
  return count === 1 ? '1 trip' : `${count} trips`;
}

// Recommended is the order the data arrives in. Sorting is stable, so ties keep that order.
function compareTrips(sort: TripSort) {
  if (sort === 'price_low') {
    return (a: TripBundle, b: TripBundle) => a.price.amount - b.price.amount;
  }
  if (sort === 'top_rated') {
    return (a: TripBundle, b: TripBundle) => b.rating - a.rating;
  }
  return null;
}

/** The trips of the chosen type, in the chosen order. Filters first, so less is sorted. */
export function getVisibleTrips(trips: TripBundle[], { tripFilter, tripSort }: AppliedFilters) {
  const filtered = tripFilter === 'all' ? trips : trips.filter((trip) => trip.kind === tripFilter);
  const compare = compareTrips(tripSort);
  if (!compare) return filtered;
  // Sort a copy: the stored trips must keep data order for Recommended.
  return (filtered === trips ? [...filtered] : filtered).sort(compare);
}
