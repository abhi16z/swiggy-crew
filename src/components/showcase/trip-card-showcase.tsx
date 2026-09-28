import { Text, View } from 'react-native';

import { TripCardSkeleton } from '@/components/discover-feed/trip-card-skeleton';
import { TripCard } from '@/components/trip-card';

import { SHOWCASE_BUNDLE } from './data';

export function TripCardShowcase() {
  return (
    <View className="gap-4">
      <Text className="text-xl font-semibold text-black dark:text-white">Trip card</Text>
      <TripCard trip={SHOWCASE_BUNDLE} />
      <Text className="text-xl font-semibold text-black dark:text-white">Trip card skeleton</Text>
      <TripCardSkeleton />
    </View>
  );
}
