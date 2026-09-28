import type { TripBundle } from '@/components/trip-card';

import type { TripFilter } from './store';

export function formatTripCount(count: number) {
  return count === 1 ? '1 trip' : `${count} trips`;
}

export function filterTrips(trips: TripBundle[], tripFilter: TripFilter) {
  return tripFilter === 'all' ? trips : trips.filter((trip) => trip.kind === tripFilter);
}
