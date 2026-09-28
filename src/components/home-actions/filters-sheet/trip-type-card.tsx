import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import type { TripFilter } from '@/components/discover-feed/types';
import { formatTripCount } from '@/components/discover-feed/utils';
import { ICON_COLORS } from '@/constants/colors';

import type { TripFilterOption } from './constants';

type TripTypeCardProps = TripFilterOption & {
  count: number;
  selected: boolean;
  onSelect: (value: TripFilter) => void;
};

// One trip type, compacted from design 10 so the sheet fits at half height.
// Selected: thicker border and an inverted icon.
export const TripTypeCard = memo(function TripTypeCard({
  value,
  label,
  icon,
  count,
  selected,
  onSelect,
}: TripTypeCardProps) {
  const dark = useColorScheme() === 'dark';
  // Selected icons sit on an inverted circle, so they take the other scheme's color.
  const iconColor = ICON_COLORS[dark === selected ? 'light' : 'dark'].primary;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${formatTripCount(count)}`}
      accessibilityState={{ checked: selected }}
      onPress={() => onSelect(value)}
      // The border grows by 1pt when selected; the padding shrinks by 1pt so nothing moves.
      className={`grow basis-[40%] flex-row items-center gap-2.5 rounded-2xl ${
        selected
          ? 'border-2 border-neutral-900 px-[11px] py-[9px] dark:border-white'
          : 'border border-neutral-200 px-3 py-2.5 dark:border-neutral-800'
      }`}
    >
      <View
        className={`h-8 w-8 items-center justify-center rounded-full ${
          selected ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-100 dark:bg-neutral-800'
        }`}
      >
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-semibold text-neutral-900 dark:text-white"
        >
          {label}
        </Text>
        <Text className="text-[13px] text-neutral-500 dark:text-neutral-400">
          {formatTripCount(count)}
        </Text>
      </View>
    </Pressable>
  );
});
