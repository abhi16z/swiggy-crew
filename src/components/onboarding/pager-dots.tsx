import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { ACTIVE_DOT_WIDTH, DOT_SIZE, DOT_SPACING } from './constants';

type PagerDotsProps = {
  count: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
};

// The active dot follows the finger on the UI thread, so swiping never re-renders React.
export function PagerDots({ count, scrollX, pageWidth }: PagerDotsProps) {
  const active = useAnimatedStyle(() => ({
    transform: [{ translateX: (scrollX.get() / Math.max(pageWidth, 1)) * DOT_SPACING }],
  }));

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.row, { width: (count - 1) * DOT_SPACING + ACTIVE_DOT_WIDTH }]}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className="bg-neutral-300 dark:bg-neutral-700"
          style={[styles.dot, { left: index * DOT_SPACING + (ACTIVE_DOT_WIDTH - DOT_SIZE) / 2 }]}
        />
      ))}
      <Animated.View className="bg-neutral-900 dark:bg-white" style={[styles.activeDot, active]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'center', height: DOT_SIZE },
  dot: { position: 'absolute', width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  activeDot: {
    position: 'absolute',
    left: 0,
    width: ACTIVE_DOT_WIDTH,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
