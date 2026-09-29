import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

type TapPulseProps = {
  progress: SharedValue<number>;
  /** Loop progress at which the "finger" lands. */
  at: number;
};

const HALF_WINDOW = 0.06;

// A finger tap drawn over a control: a ring that shrinks onto it and fades. Place it as the
// last child of a control whose content is centered; it centers itself there.
export function TapPulse({ progress, at }: TapPulseProps) {
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    const range = [at - HALF_WINDOW, at, at + HALF_WINDOW];
    return {
      opacity: interpolate(p, range, [0, 1, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(p, range, [1.6, 1, 0.85], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute h-10 w-10 rounded-full border-2 border-neutral-900/60 bg-neutral-900/15 dark:border-white/80 dark:bg-white/25"
      style={style}
    />
  );
}
