import { create } from 'zustand';

import type { TripBundle } from '@/components/trip-card';

import { FETCH_TIMEOUT_MS, TRIPS_URL } from './constants';
import { getVisibleTrips } from './utils';

export type FeedStatus = 'idle' | 'loading' | 'success' | 'error';

export type TripFilter = TripBundle['kind'] | 'all';
export type TripSort = 'recommended' | 'price_low' | 'top_rated';
export type AppliedFilters = { tripFilter: TripFilter; tripSort: TripSort };

type TripsState = AppliedFilters & {
  status: FeedStatus;
  trips: TripBundle[];
  /** The trips that pass `tripFilter`, in `tripSort` order. The feed shows these. */
  visibleTrips: TripBundle[];
  loadTrips: () => Promise<void>;
  applyFilters: (filters: AppliedFilters) => void;
};

// In memory only: the data is static, so it is fetched once per app launch.
export const useTripsStore = create<TripsState>()((set, get) => ({
  status: 'idle',
  trips: [],
  tripFilter: 'all',
  tripSort: 'recommended',
  visibleTrips: [],

  loadTrips: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'success') return;

    set({ status: 'loading' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(TRIPS_URL, { signal: controller.signal });
      if (!response.ok) throw new Error(`Trips request failed with ${response.status}`);
      const trips: TripBundle[] = await response.json();
      set({ status: 'success', trips, visibleTrips: getVisibleTrips(trips, get()) });
    } catch {
      set({ status: 'error' });
    } finally {
      clearTimeout(timeout);
    }
  },

  // Filters and sorts the stored trips once, here, so the feed never does it while rendering.
  applyFilters: (filters) => {
    const { tripFilter, tripSort, trips } = get();
    if (filters.tripFilter === tripFilter && filters.tripSort === tripSort) return;
    set({ ...filters, visibleTrips: getVisibleTrips(trips, filters) });
  },
}));
