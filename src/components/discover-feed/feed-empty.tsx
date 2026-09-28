import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SKELETON_COUNT } from './constants';
import { TripCardSkeleton } from './trip-card-skeleton';
import type { FeedStatus } from './types';

const SKELETON_KEYS = Array.from({ length: SKELETON_COUNT }, (_, index) => `skeleton-${index}`);

type FeedEmptyProps = {
  status: FeedStatus;
  onRetry: () => void;
};

// What the list shows while it has no trips: skeletons while loading, otherwise a message.
export const FeedEmpty = memo(function FeedEmpty({ status, onRetry }: FeedEmptyProps) {
  if (status === 'error') {
    return (
      <View className="items-center gap-4 px-6 py-12">
        <View className="items-center gap-1">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
            Couldn&apos;t load trips
          </Text>
          <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Check your connection and try again.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          className="min-h-11 items-center justify-center rounded-full bg-neutral-900 px-6 active:opacity-70 dark:bg-white"
        >
          <Text className="text-base font-semibold text-white dark:text-black">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <Text className="py-12 text-center text-base text-neutral-500 dark:text-neutral-400">
        No trips to show right now.
      </Text>
    );
  }

  return (
    <View>
      {SKELETON_KEYS.map((key) => (
        <TripCardSkeleton key={key} />
      ))}
    </View>
  );
});
