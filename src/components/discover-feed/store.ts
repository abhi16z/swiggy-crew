import { create } from 'zustand';

import type { TripBundle } from '@/components/trip-card';

import { FETCH_TIMEOUT_MS, TRIPS_URL } from './constants';

export type FeedStatus = 'idle' | 'loading' | 'success' | 'error';

type TripsState = {
  status: FeedStatus;
  trips: TripBundle[];
  loadTrips: () => Promise<void>;
};

// In memory only: the data is static, so it is fetched once per app launch.
export const useTripsStore = create<TripsState>()((set, get) => ({
  status: 'idle',
  trips: [],
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
      set({ status: 'success', trips });
    } catch {
      set({ status: 'error' });
    } finally {
      clearTimeout(timeout);
    }
  },
}));
