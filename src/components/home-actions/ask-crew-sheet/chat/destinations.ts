import { useTripsStore } from '@/components/discover-feed/store';
import type { TripBundle } from '@/components/trip-card';

/** Unique "Destination (Country)" labels, in feed order. */
export function toDestinationList(trips: TripBundle[]): string[] {
  const labels = new Set<string>();
  for (const trip of trips) {
    const name = trip.destination.trim();
    if (name === '') continue;
    const country = trip.country.trim();
    labels.add(country ? `${name} (${country})` : name);
  }
  return [...labels];
}

let cached: Promise<string[]> | null = null;

/**
 * Destinations offered in the feed, for the assistant's system prompt. Reuses the feed's
 * trips (loading them if the feed has not); a failed load resolves to an empty list (the chat
 * still works) and is retried on the next call.
 */
export function loadDestinations() {
  cached ??= useTripsStore
    .getState()
    .loadTrips()
    .then(() => {
      const { status, trips } = useTripsStore.getState();
      if (status === 'success') return toDestinationList(trips);
      cached = null;
      return [];
    });
  return cached;
}

export function resetDestinationsCache() {
  cached = null;
}
