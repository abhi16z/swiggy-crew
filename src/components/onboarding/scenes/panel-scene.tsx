import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { SceneFrame } from './scene-frame';
import { TapPulse } from './tap-pulse';
import type { SceneProps } from './types';
import { arrive, phase, useSceneLoop } from './use-scene-loop';

const LOOP_MS = 3600;
const SWITCH_TAP = 0.25;
const THUMB_TRAVEL = 20;
const HUD_OFFSET = -140;
// Still frame: the switch is on and the panel is showing.
const REST = 0.85;

const TILES = [
  { label: 'UI FPS', value: '60' },
  { label: 'DROPS', value: '0' },
  { label: 'JS THREAD', value: 'Idle', idle: true },
];

// Settings: the Performance panel switch is turned on and the HUD drops in from the top.
export function PanelScene({ active }: SceneProps) {
  const progress = useSceneLoop(active, LOOP_MS, REST);

  const trackOn = useAnimatedStyle(() => ({
    opacity: phase(progress.get(), SWITCH_TAP + 0.02, SWITCH_TAP + 0.08),
  }));
  const thumb = useAnimatedStyle(() => ({
    transform: [
      { translateX: arrive(progress.get(), SWITCH_TAP + 0.02, SWITCH_TAP + 0.08) * THUMB_TRAVEL },
    ],
  }));
  const hud = useAnimatedStyle(() => {
    const shown = arrive(progress.get(), 0.4, 0.55);
    return { opacity: shown, transform: [{ translateY: (1 - shown) * HUD_OFFSET }] };
  });

  return (
    <SceneFrame progress={progress}>
      <View className="flex-1 justify-end gap-4 p-5">
        <Text className="text-2xl font-bold text-black dark:text-white">Settings</Text>
        <View className="min-h-11 flex-row items-center justify-between">
          <Text className="text-base text-black dark:text-white">Performance panel</Text>
          <View className="items-center justify-center">
            <View className="h-[30px] w-[50px] rounded-full bg-neutral-300 dark:bg-neutral-700">
              <Animated.View
                className="absolute inset-0 rounded-full bg-green-500"
                style={trackOn}
              />
              <Animated.View style={[styles.thumb, thumb]} className="bg-white" />
            </View>
            <TapPulse progress={progress} at={SWITCH_TAP} />
          </View>
        </View>
        <View className="min-h-11 flex-row items-center justify-between opacity-40">
          <Text className="text-base text-black dark:text-white">OpenRouter key</Text>
          <View className="h-2.5 w-20 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </View>
      </View>

      {/* The HUD is dark in both themes, like the real panel. */}
      <Animated.View
        style={[styles.hud, hud]}
        className="absolute inset-x-3 top-3 flex-row gap-2 rounded-[16px] border border-neutral-800 bg-neutral-900 p-2.5"
      >
        {TILES.map((tile) => (
          <View key={tile.label} className="flex-1 rounded-[10px] bg-neutral-800 p-2">
            <Text className="text-[9px] font-bold tracking-wider text-neutral-400">
              {tile.label}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              {tile.idle ? <View className="h-2 w-2 rounded-full bg-green-500" /> : null}
              <Text className="text-lg font-bold text-white">{tile.value}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </SceneFrame>
  );
}

const styles = StyleSheet.create({
  thumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.25)',
  },
  hud: { borderCurve: 'continuous' },
});
