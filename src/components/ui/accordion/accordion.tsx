import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, useColorScheme, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CHEVRON_COLORS, EXPAND_MS, REDUCE_MOTION_MS } from './constants';

export type AccordionProps = {
  title: string;
  /** Shown beside the chevron, so the current value reads without expanding. */
  summary?: string;
  children: ReactNode;
};

// Starts collapsed. The content mounts on first expand and then stays mounted; its height
// is measured on layout and the open/close animation runs on the UI thread.
export function Accordion({ title, summary, children }: AccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const contentHeight = useSharedValue(0);
  const progress = useSharedValue(0);
  const chevronColor = CHEVRON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    setContentMounted(true);
    progress.set(
      withTiming(next ? 1 : 0, {
        duration: reduceMotion ? REDUCE_MOTION_MS : EXPAND_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
  };

  const onContentLayout = (event: LayoutChangeEvent) => {
    contentHeight.set(event.nativeEvent.layout.height);
  };

  const bodyStyle = useAnimatedStyle(() => ({
    height: contentHeight.get() * progress.get(),
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.get() * 180}deg` }],
  }));

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summary ? `${title}, ${summary}` : title}
        accessibilityState={{ expanded }}
        onPress={toggle}
        className="min-h-12 flex-row items-center justify-between gap-3"
      >
        <Text className="text-base font-semibold text-neutral-900 dark:text-white">{title}</Text>
        <View className="shrink flex-row items-center gap-1.5">
          {summary ? (
            <Text
              numberOfLines={1}
              className="shrink text-sm text-neutral-500 dark:text-neutral-400"
            >
              {summary}
            </Text>
          ) : null}
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={18} color={chevronColor} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View
        style={bodyStyle}
        className="overflow-hidden"
        pointerEvents={expanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      >
        {/* Absolute, so the content keeps its natural height while the wrapper animates. */}
        {contentMounted ? (
          <View className="absolute inset-x-0 top-0" onLayout={onContentLayout}>
            {children}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}
