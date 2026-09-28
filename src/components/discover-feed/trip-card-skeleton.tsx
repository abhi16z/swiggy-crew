import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme, View } from 'react-native';

import { CARD_IMAGE_HEIGHT, CARD_IMAGE_RADIUS } from '@/components/trip-card/constants';

const IMAGE_ICON_COLORS = { light: '#d4d4d4', dark: '#525252' } as const;

// Design 02: a still, grey stand-in shaped like TripCard. No shimmer, so it costs no frames.
export function TripCardSkeleton() {
  const iconColor = IMAGE_ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <View
      testID="trip-card-skeleton"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="mb-4 rounded-[22px] border border-neutral-200 bg-white p-1.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View
        className="items-center justify-center bg-neutral-100 dark:bg-neutral-800"
        style={{ height: CARD_IMAGE_HEIGHT, borderRadius: CARD_IMAGE_RADIUS }}
      >
        <Ionicons name="image-outline" size={32} color={iconColor} />
      </View>

      <View className="gap-4 px-2.5 pt-4 pb-2">
        <View className="gap-2">
          <View className="flex-row justify-between">
            <View className="h-6 w-1/2 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <View className="h-5 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800" />
          </View>
          <View className="h-4 w-1/4 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        </View>
        <View className="flex-row items-center justify-between">
          <View className="gap-2">
            <View className="h-6 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <View className="h-4 w-32 rounded-full bg-neutral-100 dark:bg-neutral-800" />
          </View>
          <View className="h-11 w-28 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        </View>
      </View>
    </View>
  );
}
