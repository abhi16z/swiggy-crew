import type { TripFilter } from '@/components/discover-feed/store';
import { KIND_BADGES, type IoniconName } from '@/components/trip-card/constants';

export type TripFilterOption = { value: TripFilter; label: string; icon: IoniconName };

// Design 10 order, two per row. Types reuse the trip card badge label and icon.
export const TRIP_FILTER_OPTIONS: TripFilterOption[] = [
  { value: 'all', label: 'All trips', icon: 'grid-outline' },
  { value: 'flight_stay', ...KIND_BADGES.flight_stay },
  { value: 'villa', ...KIND_BADGES.villa },
  { value: 'experience', ...KIND_BADGES.experience },
];
