import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { useTripsStore } from '@/components/discover-feed/store';
import { formatTripCount } from '@/components/discover-feed/utils';
import { Accordion } from '@/components/ui/accordion/accordion';
import { useBottomSheetPeekInset } from '@/components/ui/bottom-sheet/context';
import type { BottomSheetSnap } from '@/components/ui/bottom-sheet/types';
import { ICON_COLORS } from '@/constants/colors';

import { SORT_OPTIONS, TRIP_FILTER_OPTIONS } from './constants';
import { SortOption } from './sort-option';
import { TripTypeCard } from './trip-type-card';
import { countTripsByFilter } from './utils';

type FiltersSheetBodyProps = {
  onSnapTo: (snap: BottomSheetSnap) => void;
  /** The sheet is at full height; otherwise it rests at half. */
  fullHeight: boolean;
};

// Design 10, compacted so the types and the buttons fit at half height. Choices reach the
// feed only through "Show N trips"; the sheet remounts this body after every close, so
// unapplied choices are dropped and Sort by starts collapsed again.
export default function FiltersSheetBody({ onSnapTo, fullHeight }: FiltersSheetBodyProps) {
  const trips = useTripsStore((state) => state.trips);
  const tripFilter = useTripsStore((state) => state.tripFilter);
  const tripSort = useTripsStore((state) => state.tripSort);
  const queueFilters = useTripsStore((state) => state.queueFilters);
  const [pendingFilter, setPendingFilter] = useState(tripFilter);
  const [pendingSort, setPendingSort] = useState(tripSort);
  const counts = useMemo(() => countTripsByFilter(trips), [trips]);
  const colors = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  // The sheet is full height and slides down to rest at half, so its lower `peekInset` is
  // then off screen. End the body above that part, so the options scroll in the part on
  // screen and the buttons stay visible.
  const peekInset = useBottomSheetPeekInset();

  // The sheet applies the choices once it has finished closing (see `FiltersSheet`).
  const showTrips = () => {
    queueFilters({ tripFilter: pendingFilter, tripSort: pendingSort });
    onSnapTo('closed');
  };

  const reset = () => {
    setPendingFilter('all');
    setPendingSort('recommended');
  };

  return (
    <View className="flex-1" style={{ marginBottom: fullHeight ? 0 : peekInset }}>
      <View className="shrink">
        {/* Scrolls only when the content overflows; until then drags still move the sheet. */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          bounces={false}
          alwaysBounceVertical={false}
        >
          <View className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text
                accessibilityRole="header"
                className="text-base font-semibold text-neutral-900 dark:text-white"
              >
                Trip type
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                onPress={() => onSnapTo('closed')}
                className="-mr-2.5 h-11 w-11 items-center justify-center rounded-full"
              >
                <Ionicons name="close" size={22} color={colors.primary} />
              </Pressable>
            </View>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Trip type"
              className="flex-row flex-wrap gap-2"
            >
              {TRIP_FILTER_OPTIONS.map((option) => (
                <TripTypeCard
                  key={option.value}
                  {...option}
                  count={counts[option.value]}
                  selected={option.value === pendingFilter}
                  onSelect={setPendingFilter}
                />
              ))}
            </View>
          </View>

          <Accordion
            title="Sort by"
            summary={SORT_OPTIONS.find((option) => option.value === pendingSort)?.label}
          >
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Sort by"
              className="mb-1 rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              {SORT_OPTIONS.map((option, index) => (
                <SortOption
                  key={option.value}
                  {...option}
                  selected={option.value === pendingSort}
                  divider={index > 0}
                  onSelect={setPendingSort}
                />
              ))}
            </View>
          </Accordion>
        </ScrollView>

        <View className="flex-row gap-2 px-4 pt-3">
          <Pressable
            accessibilityRole="button"
            onPress={reset}
            className="min-h-12 flex-1 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700"
          >
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">Reset</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={showTrips}
            className="min-h-12 flex-1 items-center justify-center rounded-full bg-neutral-900 dark:bg-white"
          >
            <Text className="text-base font-semibold text-white dark:text-neutral-900">
              Show {formatTripCount(counts[pendingFilter])}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// The gesture-handler ScrollView (it coordinates with the sheet's drag) is not a core
// component, so NativeWind classes don't reach it.
const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: { gap: 8, paddingHorizontal: 16 },
});
