import { create } from 'zustand';

import type { TripBundle } from '@/components/trip-card';

import { FETCH_TIMEOUT_MS, TRIPS_URL } from './constants';
import { filterTrips } from './utils';

export type FeedStatus = 'idle' | 'loading' | 'success' | 'error';

export type TripFilter = TripBundle['kind'] | 'all';

type TripsState = {
  status: FeedStatus;
  trips: TripBundle[];
  /** The applied trip type, and the trips that pass it. The feed shows `visibleTrips`. */
  tripFilter: TripFilter;
  visibleTrips: TripBundle[];
  loadTrips: () => Promise<void>;
  applyTripFilter: (tripFilter: TripFilter) => void;
};

// In memory only: the data is static, so it is fetched once per app launch.
export const useTripsStore = create<TripsState>()((set, get) => ({
  status: 'idle',
  trips: [],
  tripFilter: 'all',
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
      set({ status: 'success', trips, visibleTrips: filterTrips(trips, get().tripFilter) });
    } catch {
      set({ status: 'error' });
    } finally {
      clearTimeout(timeout);
    }
  },

  // Filters the stored trips once, here, so the feed never filters while rendering.
  applyTripFilter: (tripFilter) => {
    if (tripFilter === get().tripFilter) return;
    set({ tripFilter, visibleTrips: filterTrips(get().trips, tripFilter) });
  },
}));
