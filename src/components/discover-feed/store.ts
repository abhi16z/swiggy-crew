import { create } from 'zustand';

import type { TripBundle } from '@/components/trip-card';

import { FETCH_TIMEOUT_MS, TRIPS_URL } from './constants';
import type { AppliedFilters, FeedStatus } from './types';
import { getVisibleTrips, parseTrips } from './utils';

type TripsState = AppliedFilters & {
  status: FeedStatus;
  trips: TripBundle[];
  /** The trips that pass `tripFilter`, in `tripSort` order. The feed shows these. */
  visibleTrips: TripBundle[];
  /**
   * Filters chosen with "Show", waiting for the filters sheet to finish closing. Rebuilding the
   * feed while the sheet animates would drop frames, so the feed shows a loader meanwhile.
   */
  pendingFilters: AppliedFilters | null;
  /** Loads the trips unless they are loaded; resolves when the load in flight ends. */
  loadTrips: () => Promise<void>;
  applyFilters: (filters: AppliedFilters) => void;
  /** Queues filters to apply later; `null`, or the filters already applied, queues nothing. */
  queueFilters: (filters: AppliedFilters | null) => void;
  applyPendingFilters: () => void;
};

// Shared by every caller while a load is in flight, so Ask Crew can wait on the feed's request.
let inFlight: Promise<void> | null = null;

// In memory only: the data is static, so it is fetched once per app launch.
export const useTripsStore = create<TripsState>()((set, get) => ({
  status: 'idle',
  trips: [],
  tripFilter: 'all',
  tripSort: 'recommended',
  visibleTrips: [],
  pendingFilters: null,

  loadTrips: () => {
    if (get().status === 'success') return Promise.resolve();
    inFlight ??= (async () => {
      set({ status: 'loading' });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(TRIPS_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Trips request failed with ${response.status}`);
        const trips = parseTrips(await response.json());
        set({ status: 'success', trips, visibleTrips: getVisibleTrips(trips, get()) });
      } catch {
        set({ status: 'error' });
      } finally {
        clearTimeout(timeout);
      }
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  },

  // Filters and sorts the stored trips once, here, so the feed never does it while rendering.
  applyFilters: (filters) => {
    const { tripFilter, tripSort, trips } = get();
    if (filters.tripFilter === tripFilter && filters.tripSort === tripSort) return;
    set({ ...filters, visibleTrips: getVisibleTrips(trips, filters) });
  },

  queueFilters: (filters) => {
    const { tripFilter, tripSort, pendingFilters } = get();
    const unchanged = filters?.tripFilter === tripFilter && filters.tripSort === tripSort;
    const next = filters && !unchanged ? filters : null;
    if (next !== pendingFilters) set({ pendingFilters: next });
  },

  // One update, so the feed swaps its loader for the new trips in a single render.
  applyPendingFilters: () => {
    const { pendingFilters, trips } = get();
    if (!pendingFilters) return;
    set({
      ...pendingFilters,
      visibleTrips: getVisibleTrips(trips, pendingFilters),
      pendingFilters: null,
    });
  },
}));
