import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * One scene's timeline as progress 0 → 1, looping on the UI thread. Only the page on screen
 * loops. Other pages, and every page with Reduce Motion on, rest at `rest`: a still frame that
 * shows the finished action. A page coming on screen plays on from there, so it never jumps.
 */
export function useSceneLoop(active: boolean, durationMs: number, rest: number) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(rest);

  useEffect(() => {
    if (!active || reduceMotion) {
      cancelAnimation(progress);
      progress.set(rest);
      return;
    }

    const loop = () => {
      'worklet';
      progress.set(0);
      progress.set(withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1));
    };
    // Finish the story from the still frame, then loop from the start.
    progress.set(
      withTiming(1, { duration: (1 - rest) * durationMs, easing: Easing.linear }, (finished) => {
        if (finished) loop();
      }),
    );

    return () => cancelAnimation(progress);
  }, [active, reduceMotion, durationMs, rest, progress]);

  return progress;
}

/** 0 before `from`, 1 after `to`, linear in between. */
export function phase(progress: number, from: number, to: number) {
  'worklet';
  return interpolate(progress, [from, to], [0, 1], Extrapolation.CLAMP);
}

/** `phase` with a strong ease-out, for things that arrive. */
export function arrive(progress: number, from: number, to: number) {
  'worklet';
  return 1 - (1 - phase(progress, from, to)) ** 3;
}
