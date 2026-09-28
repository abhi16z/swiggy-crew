import { useEffect } from 'react';

import { useTripsStore } from './store';

/**
 * Loads the trips on first mount and returns them from the store. Mounting again (or a second
 * caller) reuses the stored trips instead of fetching again.
 */
export function useFetchTrips() {
  const status = useTripsStore((state) => state.status);
  const trips = useTripsStore((state) => state.trips);
  const loadTrips = useTripsStore((state) => state.loadTrips);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  return { status, trips, retry: loadTrips };
}
