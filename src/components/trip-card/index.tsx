import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useCallback, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { RemoteImage } from '@/components/ui/remote-image';
import { CARD_IMAGE_HEIGHT, CARD_IMAGE_RADIUS } from '@/components/ui/remote-image/constants';

import { ICON_COLORS, KIND_BADGES, STAR_COLOR } from './constants';
import { TripDetails } from './trip-details';
import type { TripCardProps } from './types';
import { formatDays, formatPrice, getLoaderUri } from './utils';

export type { TripBundle, TripCardProps, TripHighlight } from './types';

// Designs 01 (collapsed) and 03 (details open).
export const TripCard = memo(function TripCard({ trip }: TripCardProps) {
  const { id, destination, country, kind, price, duration, rating, image, highlights } = trip;
  const colors = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const badge = KIND_BADGES[kind];

  // Keyed by trip id so a recycled list cell showing another trip starts collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = expandedId === id;
  const toggleDetails = useCallback(
    () => setExpandedId((current) => (current === id ? null : id)),
    [id],
  );

  return (
    <View className="mb-4 rounded-[22px] border border-neutral-200 bg-white p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
      <View>
        <RemoteImage
          uri={image.url}
          loaderUri={getLoaderUri(image.url)}
          width="100%"
          height={CARD_IMAGE_HEIGHT}
          borderRadius={CARD_IMAGE_RADIUS}
          placeholderColor={image.placeholderColor}
          accessibilityLabel={`${destination}, ${country}`}
        />
        {badge ? (
          <View className="absolute top-3 left-3 flex-row items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5">
            <Ionicons name={badge.icon} size={14} color={ICON_COLORS.light.primary} />
            <Text className="text-[13px] font-semibold text-neutral-900">{badge.label}</Text>
          </View>
        ) : null}
      </View>

      <View className="gap-4 px-2.5 pt-4 pb-2">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="text-xl font-bold text-neutral-900 dark:text-white">
              {destination}
            </Text>
            <Text numberOfLines={1} className="text-[15px] text-neutral-500 dark:text-neutral-400">
              {country}
            </Text>
          </View>
          <View
            accessible
            accessibilityLabel={`Rated ${rating.toFixed(1)} out of 5`}
            className="flex-row items-center gap-1 pt-1"
          >
            <Ionicons name="star" size={14} color={STAR_COLOR} />
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
              {rating.toFixed(1)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {formatPrice(price)}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={14} color={colors.muted} />
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {formatDays(duration.days)} · per person
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Details"
            accessibilityState={{ expanded }}
            onPress={toggleDetails}
            className={`min-h-11 flex-row items-center gap-2 rounded-full border border-neutral-200 px-5 active:opacity-70 dark:border-neutral-700 ${
              expanded ? 'bg-neutral-100 dark:bg-neutral-800' : ''
            }`}
          >
            <Text className="text-base font-semibold text-neutral-900 dark:text-white">
              Details
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {expanded ? <TripDetails highlights={highlights} /> : null}
    </View>
  );
});
