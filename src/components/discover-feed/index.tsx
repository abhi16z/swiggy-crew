import { useEffect, useMemo } from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';

import { TripCard, type TripBundle } from '@/components/trip-card';
import { ScreenSafeArea } from '@/components/ui/screen-safe-area';

import { FEED_BATCH_SIZE } from './constants';
import { FeedEmpty } from './feed-empty';
import { FeedHeader } from './feed-header';
import { useTripsStore } from './store';

function renderTrip({ item }: ListRenderItemInfo<TripBundle>) {
  return <TripCard trip={item} />;
}

// Designs 01-03. Native tabs keep this screen mounted on a tab switch, so the list and its
// scroll position survive; the trips live in a store, so a remount would not refetch either.
export function DiscoverFeed() {
  const status = useTripsStore((state) => state.status);
  const trips = useTripsStore((state) => state.trips);
  const loadTrips = useTripsStore((state) => state.loadTrips);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const header = useMemo(
    () => <FeedHeader status={status} count={trips.length} />,
    [status, trips.length],
  );
  const empty = useMemo(
    () => <FeedEmpty status={status} onRetry={loadTrips} />,
    [status, loadTrips],
  );

  // No keyExtractor: FlatList keys items by their `id` by default.
  return (
    <ScreenSafeArea>
      <FlatList
        data={trips}
        renderItem={renderTrip}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        initialNumToRender={FEED_BATCH_SIZE}
        maxToRenderPerBatch={FEED_BATCH_SIZE}
        // Bottom space lets the last card scroll clear of the floating buttons. iOS needs more:
        // there the buttons sit above the tab bar inset, which the list doesn't fully clear.
        contentContainerClassName="px-4 pb-24 ios:pb-36"
      />
    </ScreenSafeArea>
  );
}
