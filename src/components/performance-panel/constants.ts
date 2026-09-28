// Frame budgets in ms. The chart in design 08 draws reference lines at 16.7 and 22.2.
export const BUDGET_MS = 1000 / 60;
export const DROP_MS = 1000 / 45;
// Vsync timestamps jitter by a fraction of a ms; a 16.9 ms frame is still on budget.
export const SLOW_TOLERANCE_MS = 1;

// The HUD redraws 4 times a second (design 08 footer); everything else runs per frame.
export const REDRAW_MS = 250;

export const RECENT_FRAMES = 120;
export const SPARK_BARS = 12;

// Session percentiles come from a histogram, so memory stays flat however long the session runs.
// 0.1 ms bins up to 100 ms, plus one overflow bin.
export const HIST_BINS_PER_MS = 10;
export const HIST_MAX_MS = 100;
export const HIST_BINS = HIST_MAX_MS * HIST_BINS_PER_MS + 1;

// A longer gap is the app coming back from the background, not a frame.
export const MAX_FRAME_MS = 5000;

// JS thread: a heartbeat every few JS frames, a UI-side watchdog, and post-hoc block lengths.
export const JS_BEAT_EVERY = 3;
export const JS_STALL_MS = 100;
export const JS_BLOCK_MIN_MS = 50;
export const JS_BLOCK_HOLD_MS = 1500;
export const NO_BLOCKS = 'no blocks yet';

// Bar heights clamp at these values.
export const CHART_MAX_MS = 50;
export const SPARK_MAX_MS = 1000 / 30;

export const CHART_HEIGHT = 56;
export const SPARK_HEIGHT = 12;
export const SPARK_MIN_HEIGHT = 2;

export const COPIED_FEEDBACK_MS = 1500;

export const HUD_COLORS = {
  onBudget: '#a3a3a3',
  slow: '#f59e0b',
  dropped: '#ef4444',
  idle: '#22c55e',
  blocked: '#f59e0b',
  label: '#a3a3a3',
  value: '#ffffff',
  guide: '#525252',
} as const;

export const FPS_GOOD = 55;
export const FPS_OK = 45;
