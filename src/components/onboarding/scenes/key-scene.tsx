import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ICON_COLORS } from '@/constants/colors';

import { SceneFrame } from './scene-frame';
import { TapPulse } from './tap-pulse';
import type { SceneProps } from './types';
import { TypingReveal } from './typing-reveal';
import { phase, useSceneLoop } from './use-scene-loop';

const LOOP_MS = 4000;
const SAVE_TAP = 0.58;
// Still frame: the key is saved.
const REST = 0.85;

// Settings → Ask Crew: a key is typed into the field and saved.
export function KeyScene({ active }: SceneProps) {
  const progress = useSceneLoop(active, LOOP_MS, REST);
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  // The Save button is dark on light and light on dark.
  const onButton = ICON_COLORS[scheme === 'dark' ? 'light' : 'dark'].primary;

  const saveLabel = useAnimatedStyle(() => ({
    opacity: 1 - phase(progress.get(), SAVE_TAP + 0.02, SAVE_TAP + 0.06),
  }));
  const savedLabel = useAnimatedStyle(() => ({
    opacity: phase(progress.get(), SAVE_TAP + 0.04, SAVE_TAP + 0.08),
  }));

  return (
    <SceneFrame progress={progress}>
      <View className="flex-1 justify-center gap-3 px-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-black dark:text-white">Settings</Text>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-neutral-800">
            <Ionicons name="key-outline" size={20} color={ICON_COLORS[scheme].primary} />
          </View>
        </View>
        <Text className="mt-2 text-xs font-semibold text-neutral-500 uppercase dark:text-neutral-400">
          Ask Crew
        </Text>
        <Text className="text-base text-black dark:text-white">OpenRouter key</Text>
        <View className="min-h-11 justify-center rounded-xl bg-white px-4 dark:bg-neutral-800">
          <TypingReveal
            progress={progress}
            from={0.12}
            to={0.45}
            coverClassName="bg-white dark:bg-neutral-800"
          >
            <Text numberOfLines={1} className="text-base text-black dark:text-white">
              sk-or-v1-••••••••••••••
            </Text>
          </TypingReveal>
        </View>
        <View className="h-11 w-28 items-center justify-center rounded-full bg-neutral-900 dark:bg-white">
          <Animated.View style={saveLabel}>
            <Text className="text-base font-medium text-white dark:text-black">Save</Text>
          </Animated.View>
          <Animated.View style={savedLabel} className="absolute flex-row items-center gap-1">
            <Ionicons name="checkmark" size={16} color={onButton} />
            <Text className="text-base font-medium text-white dark:text-black">Saved</Text>
          </Animated.View>
          <TapPulse progress={progress} at={SAVE_TAP} />
        </View>
      </View>
    </SceneFrame>
  );
}
