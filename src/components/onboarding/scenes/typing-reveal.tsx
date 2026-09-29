import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { phase } from './use-scene-loop';

type TypingRevealProps = {
  progress: SharedValue<number>;
  from: number;
  to: number;
  /** Classes for the cover, matching the background the text sits on. */
  coverClassName: string;
  children: ReactNode;
};

// "Types" its children left to right: a cover the colour of the field slides off them. Only
// a transform moves, so the text is laid out once.
export function TypingReveal({ progress, from, to, coverClassName, children }: TypingRevealProps) {
  const width = useSharedValue(0);
  const cover = useAnimatedStyle(() => ({
    transform: [{ translateX: phase(progress.get(), from, to) * width.get() }],
  }));

  return (
    <View
      className="overflow-hidden"
      onLayout={(event) => width.set(event.nativeEvent.layout.width)}
    >
      {children}
      <Animated.View style={[StyleSheet.absoluteFill, cover]} className={coverClassName} />
    </View>
  );
}
