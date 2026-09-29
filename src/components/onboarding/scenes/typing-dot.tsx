import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type TypingDotProps = {
  progress: SharedValue<number>;
  index: number;
};

// One of the "crew is typing" dots; they pulse one after another.
export function TypingDot({ progress, index }: TypingDotProps) {
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(progress.get() * 60 - index * 1.2)),
  }));

  return (
    <Animated.View
      style={style}
      className="h-2 w-2 rounded-full bg-neutral-500 dark:bg-neutral-400"
    />
  );
}
