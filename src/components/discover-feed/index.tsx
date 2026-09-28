import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { TripCard, type TripBundle } from '@/components/trip-card';
import { ScreenSafeArea } from '@/components/ui/screen-safe-area';

import { FeedEmpty } from './feed-empty';
import { FeedHeader } from './feed-header';
import { useTripsStore } from './store';

function keyOf(trip: TripBundle) {
  return trip.id;
}

function renderTrip({ item }: ListRenderItemInfo<TripBundle>) {
  return <TripCard trip={item} />;
}

// Designs 01-03. Native tabs keep this screen mounted on a tab switch, so the list and its
// scroll position survive; the trips live in a store, so a remount would not refetch either.
// FlashList recycles card views as they scroll off, so only about a screen of cards is ever
// built. TripCard and RemoteImage key their local state by trip id / image uri for this.
export function DiscoverFeed() {
  const status = useTripsStore((state) => state.status);
  const trips = useTripsStore((state) => state.visibleTrips);
  const loadTrips = useTripsStore((state) => state.loadTrips);
  const filtersKey = useTripsStore((state) => `${state.tripFilter}:${state.tripSort}`);
  // Filters wait for the sheet's close animation; only the header changes meanwhile.
  const applyingFilters = useTripsStore((state) => state.pendingFilters !== null);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const header = useMemo(
    () => <FeedHeader status={status} count={trips.length} applyingFilters={applyingFilters} />,
    [status, trips.length, applyingFilters],
  );
  const empty = useMemo(
    () => <FeedEmpty status={status} onRetry={loadTrips} />,
    [status, loadTrips],
  );

  return (
    <ScreenSafeArea>
      <FlashList
        // New filters start a new list at the top, instead of the old scroll offset landing
        // somewhere in a different set of trips.
        key={filtersKey}
        testID="trip-feed"
        data={trips}
        keyExtractor={keyOf}
        renderItem={renderTrip}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.content}
      />
    </ScreenSafeArea>
  );
}

// FlashList is not a core component, so NativeWind classes don't reach it.
const styles = StyleSheet.create({
  // Bottom space lets the last card scroll clear of the floating buttons. iOS needs more:
  // there the buttons sit above the tab bar inset, which the list doesn't fully clear.
  content: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 144 : 96 },
});
