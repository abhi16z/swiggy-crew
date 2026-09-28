import type { TripKind } from '@/components/trip-card/types';

export type FeedStatus = 'idle' | 'loading' | 'success' | 'error';

export type TripFilter = TripKind | 'all';
export type TripSort = 'recommended' | 'price_low' | 'top_rated';
export type AppliedFilters = { tripFilter: TripFilter; tripSort: TripSort };
