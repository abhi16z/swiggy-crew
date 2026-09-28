import {
  BUDGET_MS,
  DROP_MS,
  HIST_BINS,
  HIST_BINS_PER_MS,
  HIST_MAX_MS,
  RECENT_FRAMES,
  SLOW_TOLERANCE_MS,
  SPARK_BARS,
} from './constants';
import type { FrameClass, PerfSnapshot, TrackerState } from './types';

// Every function here runs inside the frame callback on the UI thread, so each is a worklet.
// They mutate the state in place: no allocation happens per frame, only per redraw.

export function createTrackerState(now: number): TrackerState {
  'worklet';
  return {
    sessionStart: now,
    frames: 0,
    drops: 0,
    worstMs: 0,
    worstAt: 0,
    recent: new Array<number>(RECENT_FRAMES).fill(0),
    recentHead: 0,
    recentCount: 0,
    hist: new Array<number>(HIST_BINS).fill(0),
    spark: new Array<number>(SPARK_BARS).fill(0),
    intervalMax: 0,
    lastRedraw: 0,
    skipNext: false,
  };
}

export function resetTracker(state: TrackerState, now: number) {
  'worklet';
  state.sessionStart = now;
  state.frames = 0;
  state.drops = 0;
  state.worstMs = 0;
  state.worstAt = 0;
  state.recent.fill(0);
  state.recentHead = 0;
  state.recentCount = 0;
  state.hist.fill(0);
  state.spark.fill(0);
  state.intervalMax = 0;
}

export function classifyFrame(ms: number): FrameClass {
  'worklet';
  if (ms > DROP_MS) return 'dropped';
  if (ms > BUDGET_MS + SLOW_TOLERANCE_MS) return 'slow';
  return 'onBudget';
}

export function recordFrame(state: TrackerState, deltaMs: number, elapsedMs: number) {
  'worklet';
  state.frames += 1;
  if (deltaMs > DROP_MS) state.drops += 1;
  if (deltaMs > state.worstMs) {
    state.worstMs = deltaMs;
    state.worstAt = elapsedMs;
  }
  if (deltaMs > state.intervalMax) state.intervalMax = deltaMs;

  state.recent[state.recentHead] = deltaMs;
  state.recentHead = (state.recentHead + 1) % RECENT_FRAMES;
  if (state.recentCount < RECENT_FRAMES) state.recentCount += 1;

  // The epsilon keeps a value like 33.3 in bin 333, not 332 (33.3 * 10 floors below 333).
  const bin = Math.min(HIST_BINS - 1, Math.floor(deltaMs * HIST_BINS_PER_MS + 1e-6));
  state.hist[bin] += 1;
}

/** Shifts the interval's worst frame into the sparkline and starts a new interval. */
export function pushSparkInterval(state: TrackerState) {
  'worklet';
  for (let i = 1; i < SPARK_BARS; i++) state.spark[i - 1] = state.spark[i];
  state.spark[SPARK_BARS - 1] = state.intervalMax;
  state.intervalMax = 0;
}

/** Frames in the last second. Extrapolated while less than a second has been recorded. */
export function currentFps(state: TrackerState): number {
  'worklet';
  let sum = 0;
  let count = 0;
  for (let i = 1; i <= state.recentCount; i++) {
    sum += state.recent[(state.recentHead - i + RECENT_FRAMES) % RECENT_FRAMES];
    count += 1;
    if (sum >= 1000) break;
  }
  if (sum <= 0) return 0;
  return Math.round((count * 1000) / sum);
}

/** Recorded frame times, oldest first. */
export function recentFrames(state: TrackerState): number[] {
  'worklet';
  const out: number[] = [];
  const start = state.recentCount < RECENT_FRAMES ? 0 : state.recentHead;
  for (let i = 0; i < state.recentCount; i++) {
    out.push(state.recent[(start + i) % RECENT_FRAMES]);
  }
  return out;
}

/** Frame time at percentile `p` (0..1), to the histogram's resolution. */
export function percentileMs(hist: number[], total: number, p: number): number {
  'worklet';
  if (total <= 0) return 0;
  const target = Math.max(1, Math.ceil(total * p));
  let cumulative = 0;
  for (let bin = 0; bin < hist.length - 1; bin++) {
    cumulative += hist[bin];
    if (cumulative >= target) return (bin + 0.5) / HIST_BINS_PER_MS;
  }
  return HIST_MAX_MS;
}

export function buildSnapshot(
  state: TrackerState,
  fps: number,
  now: number,
  jsStallMs: number,
  jsLastBlockMs: number,
): PerfSnapshot {
  'worklet';
  return {
    fps,
    drops: state.drops,
    frames: state.frames,
    elapsedMs: now - state.sessionStart,
    p50Ms: percentileMs(state.hist, state.frames, 0.5),
    p95Ms: percentileMs(state.hist, state.frames, 0.95),
    worstMs: state.worstMs,
    worstAtMs: state.worstAt,
    jsBlocked: jsStallMs > 0,
    jsStallMs,
    jsLastBlockMs,
    recent: recentFrames(state),
  };
}
