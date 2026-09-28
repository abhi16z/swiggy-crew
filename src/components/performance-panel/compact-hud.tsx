import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { HUD_COLORS, NO_BLOCKS } from './constants';
import { Readout } from './readout';
import { Sparkline } from './sparkline';
import { TILE_CLASS, TILE_LABEL_CLASS, TILE_SUB_CLASS } from './stat-tile';
import type { PerfTracker } from './use-perf-tracker';

type CompactHudProps = {
  tracker: PerfTracker;
  onExpand: () => void;
};

// Collapsed HUD: the expanded card's top row (UI FPS, drops, JS thread) on its own, in the
// same card. Tapping anywhere expands it. Every value is driven from the UI thread, so React
// never re-renders this and it keeps moving while the JS thread is blocked.
export function CompactHud({ tracker, onExpand }: CompactHudProps) {
  const { jsBlocked } = tracker;

  const jsLabelStyle = useAnimatedStyle(() => ({
    color: jsBlocked.get() === 1 ? HUD_COLORS.blocked : HUD_COLORS.label,
  }));
  const jsValueStyle = useAnimatedStyle(() => ({
    color: jsBlocked.get() === 1 ? HUD_COLORS.blocked : HUD_COLORS.value,
  }));
  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: jsBlocked.get() === 1 ? HUD_COLORS.blocked : HUD_COLORS.idle,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Expand performance panel"
      onPress={onExpand}
      className="mx-3 mt-1 rounded-[20px] bg-neutral-900 px-3 pt-3 pb-1.5 active:opacity-90"
      style={styles.continuousCorners}
    >
      <View className="flex-row gap-2">
        <View className={TILE_CLASS}>
          <Text className={TILE_LABEL_CLASS}>UI FPS</Text>
          <Readout
            value={tracker.fpsText}
            initial="–"
            style={[styles.value, styles.gap]}
            testID="hud-fps"
          />
          <View className="mt-1.5">
            <Sparkline spark={tracker.spark} />
          </View>
        </View>

        <View className={TILE_CLASS}>
          <Text className={TILE_LABEL_CLASS}>DROPS</Text>
          <Readout
            value={tracker.dropsText}
            initial="0"
            style={[styles.value, styles.gap]}
            testID="hud-drops"
          />
          <Text numberOfLines={1} className={TILE_SUB_CLASS}>
            under 45 FPS
          </Text>
        </View>

        <View className={TILE_CLASS}>
          <Readout
            value={tracker.jsLabel}
            initial="JS THREAD"
            style={[styles.label, jsLabelStyle]}
            testID="hud-js-label"
          />
          <View className="mt-1 flex-row items-center gap-1">
            <Animated.View testID="hud-js-dot" className="h-2 w-2 rounded-full" style={dotStyle} />
            <Readout
              value={tracker.jsValue}
              initial="Idle"
              style={[styles.value, styles.shrink, jsValueStyle]}
              testID="hud-js-value"
            />
          </View>
          <Readout
            value={tracker.jsSub}
            initial={NO_BLOCKS}
            style={styles.sub}
            testID="hud-js-sub"
          />
        </View>
      </View>

      <View className="mt-1 items-center">
        <Ionicons name="chevron-down" size={14} color={HUD_COLORS.label} />
      </View>
    </Pressable>
  );
}

// Readouts are animated TextInputs, which NativeWind does not style; these mirror the
// StatTile text classes.
const styles = StyleSheet.create({
  continuousCorners: { borderCurve: 'continuous' },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    height: 12,
    textTransform: 'uppercase',
  },
  value: { fontSize: 20, fontWeight: '700', color: HUD_COLORS.value, height: 24 },
  gap: { marginTop: 4 },
  shrink: { flexShrink: 1 },
  sub: { fontSize: 10, color: HUD_COLORS.label, height: 13, marginTop: 2 },
});
