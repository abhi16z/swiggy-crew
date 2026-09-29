import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { TRIP_FILTER_OPTIONS } from '@/components/home-actions/filters-sheet/constants';
import { ICON_COLORS } from '@/constants/colors';

import { SceneFrame } from './scene-frame';
import { TapPulse } from './tap-pulse';
import type { SceneProps } from './types';
import { arrive, phase, useSceneLoop } from './use-scene-loop';

const LOOP_MS = 4600;
const FILTERS_TAP = 0.12;
const VILLA_TAP = 0.45;
const APPLY_TAP = 0.66;
const SHEET_OFFSET = 240;
// Still frame: the sheet is open with Villa picked.
const REST = 0.58;

// Photo stand-ins for the feed behind the sheet: the trips' own placeholder colours.
const CARD_COLORS = ['#8a5436', '#3f6b5a'];

// Home: Filters opens the sheet, a trip type is picked and applied, and the badge shows it.
export function FiltersScene({ active }: SceneProps) {
  const progress = useSceneLoop(active, LOOP_MS, REST);
  const colors = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const sheet = useAnimatedStyle(() => {
    const p = progress.get();
    const open = arrive(p, FILTERS_TAP + 0.03, FILTERS_TAP + 0.13) * (1 - phase(p, 0.7, 0.8));
    return { transform: [{ translateY: (1 - open) * SHEET_OFFSET }] };
  });
  const picked = useAnimatedStyle(() => ({
    opacity: phase(progress.get(), VILLA_TAP + 0.01, VILLA_TAP + 0.04),
  }));
  const unpicked = useAnimatedStyle(() => ({
    opacity: 1 - phase(progress.get(), VILLA_TAP + 0.01, VILLA_TAP + 0.04),
  }));
  const badge = useAnimatedStyle(() => {
    const shown = arrive(progress.get(), 0.8, 0.86);
    return { opacity: shown, transform: [{ scale: 0.6 + 0.4 * shown }] };
  });

  return (
    <SceneFrame progress={progress}>
      <View className="flex-1 gap-3 p-4">
        {CARD_COLORS.map((color) => (
          <View key={color} className="gap-2 rounded-[16px] bg-white p-1.5 dark:bg-neutral-800">
            <View className="h-16 rounded-[12px]" style={{ backgroundColor: color }} />
            <View className="flex-row justify-between px-1.5 pb-1">
              <View className="h-2.5 w-24 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <View className="h-2.5 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            </View>
          </View>
        ))}
      </View>

      <View className="absolute inset-x-4 bottom-4 flex-row justify-between">
        <View className="h-10 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-800">
          <Text className="text-sm font-medium text-black dark:text-white">Filters</Text>
          <Animated.View
            style={badge}
            className="absolute -top-1.5 -right-1.5 h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 dark:bg-white"
          >
            <Text className="text-[11px] font-bold text-white dark:text-neutral-900">1</Text>
          </Animated.View>
          <TapPulse progress={progress} at={FILTERS_TAP} />
        </View>
        <View className="h-10 items-center justify-center rounded-full bg-neutral-900 px-4 dark:bg-white">
          <Text className="text-sm font-medium text-white dark:text-black">Ask Crew</Text>
        </View>
      </View>

      <Animated.View
        style={[styles.sheet, sheet]}
        className="absolute inset-x-0 bottom-0 gap-3 rounded-t-[24px] bg-white px-4 pt-2 pb-4 dark:bg-neutral-800"
      >
        <View className="h-1 w-9 self-center rounded-full bg-neutral-300 dark:bg-neutral-600" />
        <Text className="text-sm font-semibold text-black dark:text-white">Trip type</Text>
        <View className="flex-row flex-wrap gap-2">
          {TRIP_FILTER_OPTIONS.map((option) => {
            const style =
              option.value === 'villa' ? picked : option.value === 'all' ? unpicked : null;
            return (
              <View
                key={option.value}
                className="h-10 flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700"
                style={styles.chip}
              >
                <Ionicons name={option.icon} size={14} color={colors.primary} />
                <Text className="text-[13px] text-black dark:text-white">{option.label}</Text>
                {style ? (
                  <Animated.View
                    style={style}
                    className="absolute inset-0 rounded-xl border-2 border-neutral-900 dark:border-white"
                  />
                ) : null}
                {option.value === 'villa' ? <TapPulse progress={progress} at={VILLA_TAP} /> : null}
              </View>
            );
          })}
        </View>
        <View className="h-10 items-center justify-center rounded-full bg-neutral-900 dark:bg-white">
          <Text className="text-sm font-semibold text-white dark:text-black">Apply</Text>
          <TapPulse progress={progress} at={APPLY_TAP} />
        </View>
      </Animated.View>
    </SceneFrame>
  );
}

const styles = StyleSheet.create({
  sheet: { borderCurve: 'continuous', boxShadow: '0px -4px 16px rgba(0,0,0,0.12)' },
  // Two chips per row, like the real sheet.
  chip: { flexBasis: '47%', flexGrow: 1 },
});
