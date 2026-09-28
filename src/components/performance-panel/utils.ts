import { Platform } from 'react-native';

import { DROP_MS, FPS_GOOD, FPS_OK, HUD_COLORS } from './constants';
import type { PerfSnapshot } from './types';

/** `mm:ss`, e.g. 42 s → `00:42`. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatMs(ms: number): string {
  return `${ms.toFixed(1)} ms`;
}

/** Thousands separators without relying on `Intl`, which low-end Android builds may lack. */
export function formatCount(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function fpsFromMs(ms: number): number {
  return ms > 0 ? Math.round(1000 / ms) : 0;
}

export function fpsColor(fps: number): string {
  if (fps >= FPS_GOOD) return HUD_COLORS.idle;
  if (fps >= FPS_OK) return HUD_COLORS.slow;
  return HUD_COLORS.dropped;
}

export function describeDevice(): string {
  const build = __DEV__ ? 'development build' : 'release build';
  return `${Platform.OS} ${Platform.Version} · ${build}`;
}

export function buildReport(snapshot: PerfSnapshot, device = describeDevice()): string {
  const {
    fps,
    drops,
    frames,
    elapsedMs,
    p50Ms,
    p95Ms,
    worstMs,
    worstAtMs,
    jsBlocked,
    jsStallMs,
    jsLastBlockMs,
    recent,
  } = snapshot;
  const jsLine = jsBlocked
    ? `blocked for ${jsStallMs} ms`
    : jsLastBlockMs > 0
      ? `idle · last block ${jsLastBlockMs} ms`
      : 'idle · no blocks';
  const droppedRecent = recent.filter((ms) => ms > DROP_MS).length;

  return [
    'SwiggyCrew performance report',
    `Device: ${device}`,
    `Session: ${formatClock(elapsedMs)} · ${formatCount(frames)} frames`,
    `UI FPS now: ${fps}`,
    `Frames under 45 FPS: ${drops}`,
    `Frame time: p50 ${formatMs(p50Ms)} · p95 ${formatMs(p95Ms)} · worst ${formatMs(worstMs)} at ${formatClock(worstAtMs)}`,
    `JS thread: ${jsLine}`,
    `Last ${recent.length} frames: ${droppedRecent} dropped · ${recent.map((ms) => ms.toFixed(1)).join(' ')}`,
  ].join('\n');
}
