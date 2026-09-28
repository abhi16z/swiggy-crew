import { HIST_MAX_MS, RECENT_FRAMES, SPARK_BARS } from './constants';
import {
  buildSnapshot,
  classifyFrame,
  createTrackerState,
  currentFps,
  percentileMs,
  pushSparkInterval,
  recentFrames,
  recordFrame,
  resetTracker,
} from './tracker';

const VSYNC = 1000 / 60;

function stateWithFrames(frames: number[]) {
  const state = createTrackerState(0);
  let elapsed = 0;
  for (const ms of frames) {
    elapsed += ms;
    recordFrame(state, ms, elapsed);
  }
  return state;
}

describe('classifyFrame', () => {
  it('keeps a vsync-aligned frame with jitter on budget', () => {
    expect(classifyFrame(VSYNC)).toBe('onBudget');
    expect(classifyFrame(16.9)).toBe('onBudget');
  });

  it('marks frames between the budget and 45 FPS as slow, and beyond as dropped', () => {
    expect(classifyFrame(18)).toBe('slow');
    expect(classifyFrame(22.2)).toBe('slow');
    expect(classifyFrame(22.3)).toBe('dropped');
    expect(classifyFrame(2 * VSYNC)).toBe('dropped');
  });
});

describe('recordFrame', () => {
  it('counts only frames slower than 45 FPS as drops', () => {
    const state = stateWithFrames([VSYNC, 20, 2 * VSYNC, 48.3, VSYNC]);

    expect(state.frames).toBe(5);
    expect(state.drops).toBe(2);
  });

  it('remembers the worst frame and when it happened', () => {
    const state = stateWithFrames([VSYNC, 48.3, 30, VSYNC]);

    expect(state.worstMs).toBe(48.3);
    expect(state.worstAt).toBeCloseTo(VSYNC + 48.3);
  });

  it('keeps the last 120 frames in order once the ring buffer wraps', () => {
    const frames = Array.from({ length: RECENT_FRAMES + 5 }, (_, i) => i + 1);
    const state = stateWithFrames(frames);

    const recent = recentFrames(state);
    expect(recent).toHaveLength(RECENT_FRAMES);
    expect(recent[0]).toBe(6);
    expect(recent[RECENT_FRAMES - 1]).toBe(RECENT_FRAMES + 5);
  });

  it('returns only recorded frames before the buffer is full', () => {
    expect(recentFrames(stateWithFrames([10, 20, 30]))).toEqual([10, 20, 30]);
  });
});

describe('currentFps', () => {
  it('reports the refresh rate for steady frames', () => {
    expect(currentFps(stateWithFrames(new Array(120).fill(VSYNC)))).toBe(60);
    expect(currentFps(stateWithFrames(new Array(120).fill(1000 / 120)))).toBe(120);
  });

  it('extrapolates from less than a second of data', () => {
    expect(currentFps(stateWithFrames(new Array(15).fill(VSYNC)))).toBe(60);
    expect(currentFps(createTrackerState(0))).toBe(0);
  });

  it('drops when a stall lands inside the last second', () => {
    const state = stateWithFrames([
      ...new Array(60).fill(VSYNC),
      500,
      ...new Array(30).fill(VSYNC),
    ]);

    expect(currentFps(state)).toBeLessThan(40);
  });
});

describe('pushSparkInterval', () => {
  it('shifts the interval maximum into the newest bar and starts a fresh interval', () => {
    const state = stateWithFrames([VSYNC, 40, VSYNC]);

    pushSparkInterval(state);
    expect(state.spark[SPARK_BARS - 1]).toBe(40);
    expect(state.intervalMax).toBe(0);

    recordFrame(state, VSYNC, 100);
    pushSparkInterval(state);
    expect(state.spark[SPARK_BARS - 2]).toBe(40);
    expect(state.spark[SPARK_BARS - 1]).toBeCloseTo(VSYNC);
  });
});

describe('percentileMs', () => {
  it('finds p50 and p95 to the histogram resolution', () => {
    const state = stateWithFrames([...new Array(95).fill(VSYNC), ...new Array(5).fill(33.3)]);

    expect(percentileMs(state.hist, state.frames, 0.5)).toBeCloseTo(16.65, 5);
    expect(percentileMs(state.hist, state.frames, 0.95)).toBeCloseTo(16.65, 5);
    expect(percentileMs(state.hist, state.frames, 0.99)).toBeCloseTo(33.35, 5);
  });

  it('returns 0 with no frames and the cap for frames past the last bin', () => {
    expect(percentileMs(createTrackerState(0).hist, 0, 0.5)).toBe(0);

    const state = stateWithFrames([250, 400]);
    expect(percentileMs(state.hist, state.frames, 0.5)).toBe(HIST_MAX_MS);
  });
});

describe('buildSnapshot and resetTracker', () => {
  it('builds a snapshot from the recorded session', () => {
    const state = stateWithFrames([VSYNC, VSYNC, 48.3]);
    state.sessionStart = 1000;

    const snapshot = buildSnapshot(state, 58, 43_000, 0, 84);

    expect(snapshot).toMatchObject({
      fps: 58,
      drops: 1,
      frames: 3,
      elapsedMs: 42_000,
      worstMs: 48.3,
      jsBlocked: false,
      jsStallMs: 0,
      jsLastBlockMs: 84,
    });
    expect(snapshot.recent).toEqual([VSYNC, VSYNC, 48.3]);
    expect(buildSnapshot(state, 58, 43_000, 120, 84).jsBlocked).toBe(true);
  });

  it('clears every counter on reset and restarts the session clock', () => {
    const state = stateWithFrames([VSYNC, 48.3]);
    pushSparkInterval(state);

    resetTracker(state, 5000);

    expect(state).toMatchObject({
      sessionStart: 5000,
      frames: 0,
      drops: 0,
      worstMs: 0,
      worstAt: 0,
      recentCount: 0,
      intervalMax: 0,
    });
    expect(state.spark.every((ms) => ms === 0)).toBe(true);
    expect(state.hist.every((count) => count === 0)).toBe(true);
    expect(currentFps(state)).toBe(0);
  });
});
