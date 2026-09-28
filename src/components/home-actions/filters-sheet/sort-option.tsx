import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, Text, useColorScheme } from 'react-native';

import type { TripSort } from '@/components/discover-feed/types';
import { ICON_COLORS } from '@/constants/colors';

type SortOptionProps = {
  value: TripSort;
  label: string;
  selected: boolean;
  /** Draws a line above the row; every row but the first has one. */
  divider: boolean;
  onSelect: (value: TripSort) => void;
};

// One row of the Sort by list in design 10, with a check mark on the chosen one.
export const SortOption = memo(function SortOption({
  value,
  label,
  selected,
  divider,
  onSelect,
}: SortOptionProps) {
  const colors = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={() => onSelect(value)}
      className={`min-h-12 flex-row items-center justify-between gap-3 px-4 ${
        divider ? 'border-t border-neutral-200 dark:border-neutral-800' : ''
      }`}
    >
      <Text
        className={`text-[15px] text-neutral-900 dark:text-white ${selected ? 'font-semibold' : ''}`}
      >
        {label}
      </Text>
      {selected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
    </Pressable>
  );
});
