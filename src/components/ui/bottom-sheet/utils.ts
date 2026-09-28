import { Color } from 'expo-router';
import { Easing, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { CLOSED_GAP, REDUCE_MOTION_MS } from './constants';
import type { BottomSheetSnap } from './types';

export function snapIndex(snap: BottomSheetSnap) {
  if (snap === 'full') return 1;
  if (snap === 'closed') return 2;
  return 0;
}

export function halfOffset(height: number, topInset: number) {
  'worklet';
  return Math.max(0, height / 2 - topInset);
}

export function closedOffset(height: number, topInset: number) {
  'worklet';
  return Math.max(0, height - topInset) + CLOSED_GAP;
}

export function offsetFor(index: number, height: number, topInset: number) {
  'worklet';
  if (index === 1) return 0;
  if (index === 2) return closedOffset(height, topInset);
  return halfOffset(height, topInset);
}

/**
 * Counter-translation that keeps a footer on the screen's bottom edge between full and half,
 * then lets it ride down with the sheet from half to closed.
 */
export function footerOffset(translateY: number, half: number) {
  'worklet';
  // `0 -` rather than unary minus so a resting footer reports 0, not -0.
  return 0 - Math.min(Math.max(translateY, 0), half);
}

export function resist(value: number, min: number, max: number, size: number) {
  'worklet';
  const band = size > 0 ? size : 1;
  if (value < min) {
    const over = min - value;
    return min - (1 - 1 / ((over * 0.55) / band + 1)) * band;
  }
  if (value > max) {
    const over = value - max;
    return max + (1 - 1 / ((over * 0.55) / band + 1)) * band;
  }
  return value;
}

export function nearestOffset(value: number, full: number, half: number, closedY: number) {
  'worklet';
  const snaps = [full, half, closedY];
  let best = snaps[0];
  let bestDist = Math.abs(value - best);
  for (let i = 1; i < snaps.length; i++) {
    const dist = Math.abs(value - snaps[i]);
    if (dist < bestDist) {
      best = snaps[i];
      bestDist = dist;
    }
  }
  return best;
}

export function neighborOffset(
  current: number,
  direction: number,
  full: number,
  half: number,
  closedY: number,
) {
  'worklet';
  const snaps = [full, half, closedY];
  if (direction < 0) {
    let dest = snaps[0];
    for (let i = snaps.length - 1; i >= 0; i--) {
      if (snaps[i] < current - 0.5) {
        dest = snaps[i];
        break;
      }
    }
    return dest;
  }
  let dest = snaps[snaps.length - 1];
  for (let i = 0; i < snaps.length; i++) {
    if (snaps[i] > current + 0.5) {
      dest = snaps[i];
      break;
    }
  }
  return dest;
}

export function settle(
  translateY: SharedValue<number>,
  reduceMotion: SharedValue<boolean>,
  dest: number,
  velocity: number,
  flung: boolean,
  onFinished: (finished?: boolean) => void,
) {
  'worklet';
  if (reduceMotion.get()) {
    translateY.set(
      withTiming(
        dest,
        {
          duration: REDUCE_MOTION_MS,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        },
        onFinished,
      ),
    );
    return;
  }
  translateY.set(
    withSpring(
      dest,
      {
        duration: flung ? 300 : 400,
        dampingRatio: flung ? 0.8 : 1,
        velocity,
      },
      onFinished,
    ),
  );
}

export function surfaceColor(scheme: string | null | undefined) {
  if (process.env.EXPO_OS === 'ios') return Color.ios.systemBackground;
  if (process.env.EXPO_OS === 'android') return Color.android.attr.colorBackgroundFloating;
  return scheme === 'dark' ? '#1c1c1e' : '#ffffff';
}

export function handleColor(scheme: string | null | undefined) {
  if (process.env.EXPO_OS === 'ios') return Color.ios.systemGray3;
  if (process.env.EXPO_OS === 'android') return Color.android.darker_gray;
  return scheme === 'dark' ? '#48484a' : '#c6c6c8';
}
