export type FrameClass = 'onBudget' | 'slow' | 'dropped';

/** Bookkeeping for the UI thread. Held in one shared value and only touched from worklets. */
export type TrackerState = {
  /** `Date.now()` at the last reset. */
  sessionStart: number;
  frames: number;
  drops: number;
  worstMs: number;
  /** ms into the session when the worst frame happened. */
  worstAt: number;
  /** Ring buffer of the last `RECENT_FRAMES` frame times. */
  recent: number[];
  recentHead: number;
  recentCount: number;
  /** `HIST_BINS` counts, `HIST_BIN_MS` wide, for session percentiles. */
  hist: number[];
  /** Worst frame per redraw interval, oldest first, for the compact sparkline. */
  spark: number[];
  intervalMax: number;
  /** Frame timestamp of the last redraw. */
  lastRedraw: number;
  /** Set on foregrounding: the next delta spans the background gap and is discarded. */
  skipNext: boolean;
};

/** What the expanded panel shows. Sent to React 4 times a second while it is open. */
export type PerfSnapshot = {
  fps: number;
  drops: number;
  frames: number;
  elapsedMs: number;
  p50Ms: number;
  p95Ms: number;
  worstMs: number;
  worstAtMs: number;
  jsBlocked: boolean;
  /** How long the current stall has lasted; 0 unless blocked. */
  jsStallMs: number;
  /** Length of the last finished block; 0 if none yet. */
  jsLastBlockMs: number;
  /** Last frame times, oldest first. */
  recent: number[];
};
