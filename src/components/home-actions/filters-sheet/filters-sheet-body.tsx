import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { useTripsStore } from '@/components/discover-feed/store';
import { formatTripCount } from '@/components/discover-feed/utils';
import { ICON_COLORS } from '@/components/trip-card/constants';
import type { BottomSheetSnap } from '@/components/ui/bottom-sheet';

import { TRIP_FILTER_OPTIONS } from './constants';
import { TripTypeCard } from './trip-type-card';
import { countTripsByFilter } from './utils';

type FiltersSheetBodyProps = {
  onSnapTo: (snap: BottomSheetSnap) => void;
};

// Design 10, compacted so the types and their buttons fit at half height (sorting comes
// later, collapsed). A choice here reaches the feed only through "Show N trips"; the sheet
// remounts this body after every close, so an unapplied choice is dropped.
export default function FiltersSheetBody({ onSnapTo }: FiltersSheetBodyProps) {
  const trips = useTripsStore((state) => state.trips);
  const tripFilter = useTripsStore((state) => state.tripFilter);
  const applyTripFilter = useTripsStore((state) => state.applyTripFilter);
  const [pending, setPending] = useState(tripFilter);
  const counts = useMemo(() => countTripsByFilter(trips), [trips]);
  const colors = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const showTrips = () => {
    applyTripFilter(pending);
    onSnapTo('closed');
  };

  return (
    <View className="gap-4 px-4">
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
              selected={option.value === pending}
              onSelect={setPending}
            />
          ))}
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={() => setPending('all')}
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
            Show {formatTripCount(counts[pending])}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
