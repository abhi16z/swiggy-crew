import { memo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import type { FeedStatus } from './types';
import { formatTripCount } from './utils';

type FeedHeaderProps = {
  status: FeedStatus;
  count: number;
  /** New filters are waiting to be applied; the count shown is about to change. */
  applyingFilters: boolean;
};

// Designs 01 and 02. Scrolls away with the cards; search and profile are not built yet.
export const FeedHeader = memo(function FeedHeader({
  status,
  count,
  applyingFilters,
}: FeedHeaderProps) {
  const loading = status === 'idle' || status === 'loading' || applyingFilters;

  return (
    <View className="gap-6 pt-2 pb-4">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="text-4xl font-bold text-neutral-900 dark:text-white"
        >
          Discover
        </Text>
        <Text className="text-base text-neutral-500 dark:text-neutral-400">
          Handpicked trips, ready when you are.
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <Text
          accessibilityRole="header"
          className="text-xl font-bold text-neutral-900 dark:text-white"
        >
          Trending this month
        </Text>
        {loading ? (
          <View className="flex-row items-center gap-1.5">
            <ActivityIndicator size="small" />
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">Loading</Text>
          </View>
        ) : null}
        {status === 'success' && !loading ? (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatTripCount(count)}
          </Text>
        ) : null}
      </View>
    </View>
  );
});
