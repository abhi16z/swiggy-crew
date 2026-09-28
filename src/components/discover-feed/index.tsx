import { useEffect, useMemo, useRef } from 'react';
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
  const trips = useTripsStore((state) => state.visibleTrips);
  const loadTrips = useTripsStore((state) => state.loadTrips);
  const listRef = useRef<FlatList<TripBundle>>(null);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  // A newly applied filter shows its trips from the top. Subscribing (not selecting) keeps
  // the filter itself from re-rendering the feed; only the new trips do.
  useEffect(
    () =>
      useTripsStore.subscribe((state, previous) => {
        if (state.tripFilter === previous.tripFilter) return;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }),
    [],
  );

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
        ref={listRef}
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
