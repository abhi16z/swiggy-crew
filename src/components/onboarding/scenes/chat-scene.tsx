import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { ICON_COLORS } from '@/constants/colors';

import { SceneFrame } from './scene-frame';
import { TapPulse } from './tap-pulse';
import type { SceneProps } from './types';
import { TypingDot } from './typing-dot';
import { TypingReveal } from './typing-reveal';
import { arrive, phase, useSceneLoop } from './use-scene-loop';

const LOOP_MS = 5000;
const SEND_TAP = 0.24;
const QUESTION = 'Best time to visit Goa?';
// Still frame: the question and the answer are both in.
const REST = 0.85;

function useBubbleIn(progress: SharedValue<number>, from: number) {
  return useAnimatedStyle(() => {
    const shown = arrive(progress.get(), from, from + 0.07);
    return { opacity: shown, transform: [{ translateY: (1 - shown) * 12 }] };
  });
}

// Ask Crew: a question is typed and sent, the crew "types", and the answer arrives.
export function ChatScene({ active }: SceneProps) {
  const progress = useSceneLoop(active, LOOP_MS, REST);
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const onButton = ICON_COLORS[scheme === 'dark' ? 'light' : 'dark'].primary;

  const question = useBubbleIn(progress, SEND_TAP + 0.02);
  const answer = useBubbleIn(progress, 0.56);
  const typing = useAnimatedStyle(() => {
    const p = progress.get();
    return { opacity: phase(p, 0.33, 0.36) * (1 - phase(p, 0.54, 0.57)) };
  });
  // The draft leaves the composer when it is sent; the placeholder comes back.
  const draft = useAnimatedStyle(() => ({
    opacity: 1 - phase(progress.get(), SEND_TAP + 0.01, SEND_TAP + 0.03),
  }));
  const placeholder = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: Math.max(1 - phase(p, 0.06, 0.07), phase(p, SEND_TAP + 0.02, SEND_TAP + 0.04)),
    };
  });

  return (
    <SceneFrame progress={progress}>
      <View className="flex-row items-center justify-center px-4 pt-4 pb-2">
        <Text className="text-base font-semibold text-black dark:text-white">Ask Crew</Text>
      </View>

      <View className="flex-1 justify-end gap-2 px-4 pb-3">
        <Animated.View
          style={[styles.bubble, question]}
          className="max-w-[80%] self-end rounded-[18px] bg-neutral-900 px-3.5 py-2.5 dark:bg-white"
        >
          <Text className="text-[15px] text-white dark:text-black">{QUESTION}</Text>
        </Animated.View>
        <View>
          <Animated.View
            style={[styles.bubble, answer]}
            className="max-w-[85%] self-start rounded-[18px] bg-white px-3.5 py-2.5 dark:bg-neutral-800"
          >
            <Text className="text-[15px] text-black dark:text-white">
              November to February: dry, sunny days made for the beach.
            </Text>
          </Animated.View>
          <Animated.View
            style={[styles.bubble, typing]}
            className="absolute bottom-0 left-0 flex-row gap-1 rounded-[18px] bg-white px-3.5 py-3.5 dark:bg-neutral-800"
          >
            {[0, 1, 2].map((dot) => (
              <TypingDot key={dot} progress={progress} index={dot} />
            ))}
          </Animated.View>
        </View>
      </View>

      <View className="mx-3 mb-3 h-11 flex-row items-center gap-2 rounded-full bg-white pr-1.5 pl-4 dark:bg-neutral-800">
        <View className="flex-1 justify-center">
          <Animated.View style={draft}>
            <TypingReveal
              progress={progress}
              from={0.07}
              to={0.2}
              coverClassName="bg-white dark:bg-neutral-800"
            >
              <Text numberOfLines={1} className="text-[15px] text-black dark:text-white">
                {QUESTION}
              </Text>
            </TypingReveal>
          </Animated.View>
          <Animated.View style={placeholder} className="absolute">
            <Text numberOfLines={1} className="text-[15px] text-neutral-500 dark:text-neutral-400">
              Ask about a destination
            </Text>
          </Animated.View>
        </View>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-900 dark:bg-white">
          <Ionicons name="arrow-up" size={16} color={onButton} />
          <TapPulse progress={progress} at={SEND_TAP} />
        </View>
      </View>
    </SceneFrame>
  );
}

const styles = StyleSheet.create({
  bubble: { borderCurve: 'continuous' },
});
