import type { TripFilter, TripSort } from '@/components/discover-feed/store';
import { KIND_BADGES, type IoniconName } from '@/components/trip-card/constants';

export type TripFilterOption = { value: TripFilter; label: string; icon: IoniconName };

// Design 10 order, two per row. Types reuse the trip card badge label and icon.
export const TRIP_FILTER_OPTIONS: TripFilterOption[] = [
  { value: 'all', label: 'All trips', icon: 'grid-outline' },
  { value: 'flight_stay', ...KIND_BADGES.flight_stay },
  { value: 'villa', ...KIND_BADGES.villa },
  { value: 'experience', ...KIND_BADGES.experience },
];

export const SORT_OPTIONS: { value: TripSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'top_rated', label: 'Top rated' },
];

// BottomSheet's handle row (`min-h-11`), which sits above the body.
export const SHEET_HANDLE_HEIGHT = 44;
