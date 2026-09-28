import type { TripFilter } from '@/components/discover-feed/types';
import type { TripBundle } from '@/components/trip-card';

/** Trips per filter card, in one pass over the trips. */
export function countTripsByFilter(trips: TripBundle[]) {
  const counts: Record<TripFilter, number> = {
    all: trips.length,
    flight_stay: 0,
    villa: 0,
    experience: 0,
  };
  for (const trip of trips) counts[trip.kind] += 1;
  return counts;
}
