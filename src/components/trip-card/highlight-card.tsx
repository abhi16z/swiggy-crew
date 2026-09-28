import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { HIGHLIGHT_CARD_WIDTH, ICON_COLORS } from './constants';
import type { TripHighlight } from './types';
import { getHighlightIcon } from './utils';

type HighlightCardProps = {
  highlight: TripHighlight;
};

// One card in the "Day by day" row (design 03).
export const HighlightCard = memo(function HighlightCard({ highlight }: HighlightCardProps) {
  const colors = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <View
      accessible
      accessibilityLabel={`Day ${highlight.day}: ${highlight.text}`}
      style={styles.card}
      className="gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="flex-row items-center justify-between">
        <View className="size-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Ionicons name={getHighlightIcon(highlight.icon)} size={16} color={colors.primary} />
        </View>
        <Text className="text-xs font-semibold tracking-wider text-neutral-500 dark:text-neutral-400">
          DAY {highlight.day}
        </Text>
      </View>
      <Text className="text-[15px] leading-5 font-medium text-neutral-900 dark:text-white">
        {highlight.text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { width: HIGHLIGHT_CARD_WIDTH },
});
