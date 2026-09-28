import { AppState } from 'react-native';

import { BUDGET_MS, JS_BEAT_EVERY, JS_BLOCK_MIN_MS, MAX_FRAME_MS } from './constants';

type HeartbeatHandlers = {
  onBeat: (now: number) => void;
  onBlock: (blockMs: number, now: number) => void;
};

// Runs on the JS thread. requestAnimationFrame fires once per frame while JS is free, so a
// late callback means JS was busy: the gap beyond one frame is how long it was blocked.
// Beats are sent every few frames; the UI-thread watchdog treats a missing beat as a block.
export function startJsHeartbeat({ onBeat, onBlock }: HeartbeatHandlers): () => void {
  let last = Date.now();
  let ticks = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    const now = Date.now();
    const block = now - last - BUDGET_MS;
    last = now;
    ticks += 1;
    const blocked = block >= JS_BLOCK_MIN_MS && block < MAX_FRAME_MS;
    if (blocked) onBlock(Math.round(block), now);
    if (blocked || ticks % JS_BEAT_EVERY === 0) onBeat(now);
    frame = requestAnimationFrame(tick);
  };
  let frame = requestAnimationFrame(tick);

  // Frames stop in the background; the first one back would otherwise read as a block.
  const subscription = AppState.addEventListener('change', () => {
    last = Date.now();
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    subscription.remove();
  };
}
