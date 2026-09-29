import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  ACTIVE_DOT_WIDTH,
  DOT_MOVE_MS,
  DOT_SIZE,
  DOT_SPACING,
  HIGHLIGHT_GAP,
  HIGHLIGHT_INSET,
  HIGHLIGHT_SNAP_INTERVAL,
} from './constants';
import { HighlightCard } from './highlight-card';
import type { TripHighlight } from './types';
import { getActiveHighlight } from './utils';

type TripDetailsProps = {
  highlights: TripHighlight[];
  /** "3 highlights", formatted when the trips load. */
  countLabel: string;
};

// Expanded "Day by day" section (design 03). The page dots follow the row on the UI thread,
// so swiping through highlights never re-renders React.
export function TripDetails({ highlights, countLabel }: TripDetailsProps) {
  const count = highlights.length;
  const activeIndex = useSharedValue(0);
  // With reduced motion the active dot jumps to its place instead of sliding.
  const dotMoveMs = useReducedMotion() ? 0 : DOT_MOVE_MS;

  const onScroll = useAnimatedScrollHandler((event) => {
    const maxOffsetX = event.contentSize.width - event.layoutMeasurement.width;
    const next = getActiveHighlight(
      event.contentOffset.x,
      maxOffsetX,
      HIGHLIGHT_SNAP_INTERVAL,
      count,
    );
    if (next !== activeIndex.value) activeIndex.value = next;
  });

  const activeDotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(activeIndex.value * DOT_SPACING, { duration: dotMoveMs }) },
    ],
  }));

  return (
    <View className="mt-1.5 gap-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 py-4 dark:border-neutral-800 dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-3.5">
        <Text className="text-base font-semibold text-neutral-900 dark:text-white">Day by day</Text>
        <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">{countLabel}</Text>
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={HIGHLIGHT_SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
        disableIntervalMomentum
      >
        {highlights.map((highlight) => (
          <HighlightCard key={highlight.id} highlight={highlight} />
        ))}
      </Animated.ScrollView>

      {count > 1 ? (
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[styles.dots, { width: (count - 1) * DOT_SPACING + ACTIVE_DOT_WIDTH }]}
        >
          {highlights.map((highlight, index) => (
            <View
              key={highlight.id}
              className="bg-neutral-300 dark:bg-neutral-700"
              style={[
                styles.dot,
                { left: index * DOT_SPACING + (ACTIVE_DOT_WIDTH - DOT_SIZE) / 2 },
              ]}
            />
          ))}
          <Animated.View
            className="bg-neutral-900 dark:bg-white"
            style={[styles.activeDot, activeDotStyle]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: HIGHLIGHT_GAP, paddingHorizontal: HIGHLIGHT_INSET },
  dots: { alignSelf: 'center', height: DOT_SIZE },
  dot: { position: 'absolute', width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  activeDot: {
    position: 'absolute',
    left: 0,
    width: ACTIVE_DOT_WIDTH,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
