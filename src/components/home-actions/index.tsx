import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTripsStore } from '@/components/discover-feed/store';
import { TabBarSafeArea } from '@/components/ui/tab-bar-safe-area';

import { askCrewSheetRef, filtersSheetRef } from './sheet-refs';

export { HomeSheets } from './sheets';

// Floating Filters and Ask Crew buttons. The sheets they open live in the root layout
// (`HomeSheets`), so pressing one never re-renders the Home screen or the feed beside it.
export function HomeActions() {
  // Re-renders only these buttons, and only when the badge count changes.
  const appliedCount = useTripsStore(
    (state) => Number(state.tripFilter !== 'all') + Number(state.tripSort !== 'recommended'),
  );

  // The sheets sit above every tab; close them if Home loses focus so they never
  // show over another tab.
  useFocusEffect(
    useCallback(
      () => () => {
        filtersSheetRef.current?.snapTo('closed');
        askCrewSheetRef.current?.snapTo('closed');
      },
      [],
    ),
  );

  return (
    <TabBarSafeArea>
      <View
        className="flex-1 flex-row items-end justify-between px-4 pb-6"
        pointerEvents="box-none"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          accessibilityValue={
            appliedCount > 0
              ? { text: `${appliedCount} ${appliedCount === 1 ? 'filter' : 'filters'} applied` }
              : undefined
          }
          onPress={() => filtersSheetRef.current?.snapTo('half')}
          className="min-h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 shadow-[0px_0px_12px_rgba(0,0,0,0.15)] dark:border-neutral-700 dark:bg-neutral-800"
        >
          <Text className="text-base font-medium text-black dark:text-white">Filters</Text>
          {appliedCount > 0 ? (
            <View
              testID="filters-badge"
              className="absolute -top-1.5 -right-1.5 h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-neutral-900 px-1 dark:border-neutral-800 dark:bg-white"
            >
              <Text className="text-xs font-bold text-white dark:text-neutral-900">
                {appliedCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Ask Crew"
          onPress={() => askCrewSheetRef.current?.snapTo('half')}
          className="min-h-11 items-center justify-center rounded-full bg-neutral-900 px-5 dark:bg-white"
        >
          <Text className="text-base font-medium text-white dark:text-black">Talk To Crew</Text>
        </Pressable>
      </View>
    </TabBarSafeArea>
  );
}
