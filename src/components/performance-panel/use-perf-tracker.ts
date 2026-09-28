import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  useFrameCallback,
  useSharedValue,
  type FrameInfo,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { JS_BLOCK_HOLD_MS, JS_STALL_MS, MAX_FRAME_MS, NO_BLOCKS, REDRAW_MS } from './constants';
import { startJsHeartbeat } from './js-heartbeat';
import { clearSnapshot, publishSnapshot } from './snapshot-store';
import {
  buildSnapshot,
  createTrackerState,
  currentFps,
  pushSparkInterval,
  recordFrame,
  resetTracker,
} from './tracker';

export type PerfTracker = {
  fpsText: SharedValue<string>;
  dropsText: SharedValue<string>;
  jsLabel: SharedValue<string>;
  jsValue: SharedValue<string>;
  /** "last block N ms" or "no blocks yet", under the JS readout. */
  jsSub: SharedValue<string>;
  /** 1 while the JS thread is blocked or a finished block is still being shown. */
  jsBlocked: SharedValue<number>;
  /** Worst frame per redraw interval, oldest first. */
  spark: SharedValue<number[]>;
  reset: () => void;
};

// Every frame is sampled on the UI thread; the compact readouts are shared values that the
// same thread updates 4 times a second, so they keep moving even while JS is blocked.
// React only hears about frames while the panel is expanded, via one snapshot per redraw.
export function usePerfTracker(expanded: boolean): PerfTracker {
  const [initial] = useState(() => createTrackerState(Date.now()));
  const state = useSharedValue(initial);
  const fpsText = useSharedValue('–');
  const dropsText = useSharedValue('0');
  const jsLabel = useSharedValue('JS THREAD');
  const jsValue = useSharedValue('Idle');
  const jsSub = useSharedValue(NO_BLOCKS);
  const jsBlocked = useSharedValue(0);
  const spark = useSharedValue<number[]>(initial.spark.slice());
  const lastBeat = useSharedValue(initial.sessionStart);
  const lastBlockMs = useSharedValue(0);
  const lastBlockAt = useSharedValue(0);
  const publishing = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    publishing.set(expanded ? 1 : 0);
  }, [expanded, publishing]);

  useEffect(
    () =>
      startJsHeartbeat({
        onBeat: (now) => lastBeat.set(now),
        onBlock: (blockMs, now) => {
          lastBlockMs.set(blockMs);
          lastBlockAt.set(now);
        },
      }),
    [lastBeat, lastBlockAt, lastBlockMs],
  );

  // The first frame after a background stint spans the whole gap; it is not a frame time.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', () => {
      scheduleOnUI(() => {
        'worklet';
        state.get().skipNext = true;
      });
    });
    return () => subscription.remove();
  }, [state]);

  const onFrame = useCallback(
    (frame: FrameInfo) => {
      'worklet';
      const s = state.get();
      const now = Date.now();
      const delta = frame.timeSincePreviousFrame;
      if (delta !== null) {
        if (s.skipNext || delta > MAX_FRAME_MS) s.skipNext = false;
        else recordFrame(s, delta, now - s.sessionStart);
      }
      if (frame.timestamp - s.lastRedraw < REDRAW_MS) return;
      s.lastRedraw = frame.timestamp;

      pushSparkInterval(s);
      const fps = currentFps(s);
      fpsText.set(String(fps));
      dropsText.set(String(s.drops));
      spark.set(s.spark.slice());

      const sinceBeat = now - lastBeat.get();
      const stallMs = sinceBeat > JS_STALL_MS ? Math.round(sinceBeat) : 0;
      const lastBlock = lastBlockMs.get();
      // A finished block stays on the compact readout for a moment, or it would flash by.
      const holding = lastBlock > 0 && now - lastBlockAt.get() < JS_BLOCK_HOLD_MS;
      jsSub.set(lastBlock > 0 ? `last block ${lastBlock} ms` : NO_BLOCKS);
      if (stallMs > 0 || holding) {
        jsLabel.set('JS BLOCKED');
        jsValue.set(`${stallMs > 0 ? stallMs : lastBlock} ms`);
        jsBlocked.set(1);
      } else {
        jsLabel.set('JS THREAD');
        jsValue.set('Idle');
        jsBlocked.set(0);
      }

      if (publishing.get() === 1) {
        scheduleOnRN(publishSnapshot, buildSnapshot(s, fps, now, stallMs, lastBlock));
      }
    },
    [
      dropsText,
      fpsText,
      jsBlocked,
      jsLabel,
      jsSub,
      jsValue,
      lastBeat,
      lastBlockAt,
      lastBlockMs,
      publishing,
      spark,
      state,
    ],
  );

  useFrameCallback(onFrame);

  const reset = useCallback(() => {
    clearSnapshot();
    lastBlockMs.set(0);
    lastBlockAt.set(0);
    scheduleOnUI(() => {
      'worklet';
      resetTracker(state.get(), Date.now());
    });
  }, [lastBlockAt, lastBlockMs, state]);

  return { fpsText, dropsText, jsLabel, jsValue, jsSub, jsBlocked, spark, reset };
}
