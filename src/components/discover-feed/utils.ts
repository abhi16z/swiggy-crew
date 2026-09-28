import type { TripBundle } from '@/components/trip-card';

import type { AppliedFilters, TripSort } from './store';

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
