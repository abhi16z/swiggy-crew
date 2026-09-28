import { HUD_COLORS } from './constants';
import type { PerfSnapshot } from './types';
import { buildReport, formatClock, formatCount, formatMs, fpsColor, fpsFromMs } from './utils';

const snapshot: PerfSnapshot = {
  fps: 58,
  drops: 3,
  frames: 2514,
  elapsedMs: 42_000,
  p50Ms: 16.6,
  p95Ms: 19.8,
  worstMs: 48.3,
  worstAtMs: 31_000,
  jsBlocked: false,
  jsStallMs: 0,
  jsLastBlockMs: 84,
  recent: [16.7, 16.7, 48.3],
};

describe('formatting', () => {
  it('formats the session clock as mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(42_000)).toBe('00:42');
    expect(formatClock(3_599_999)).toBe('59:59');
    expect(formatClock(-5)).toBe('00:00');
  });

  it('formats frame times and counts', () => {
    expect(formatMs(16.65)).toBe('16.6 ms');
    expect(formatMs(48.3)).toBe('48.3 ms');
    expect(formatCount(2514)).toBe('2,514');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1_234_567)).toBe('1,234,567');
  });

  it('derives FPS from a frame time', () => {
    expect(fpsFromMs(16.6)).toBe(60);
    expect(fpsFromMs(19.8)).toBe(51);
    expect(fpsFromMs(0)).toBe(0);
  });

  it('colours FPS green, amber, then red as it falls', () => {
    expect(fpsColor(60)).toBe(HUD_COLORS.idle);
    expect(fpsColor(55)).toBe(HUD_COLORS.idle);
    expect(fpsColor(50)).toBe(HUD_COLORS.slow);
    expect(fpsColor(30)).toBe(HUD_COLORS.dropped);
  });
});

describe('buildReport', () => {
  it('lists the session, percentiles, JS thread and recent frames', () => {
    const report = buildReport(snapshot, 'android 13 · release build');

    expect(report).toContain('Device: android 13 · release build');
    expect(report).toContain('Session: 00:42 · 2,514 frames');
    expect(report).toContain('UI FPS now: 58');
    expect(report).toContain('Frames under 45 FPS: 3');
    expect(report).toContain('p50 16.6 ms · p95 19.8 ms · worst 48.3 ms at 00:31');
    expect(report).toContain('JS thread: idle · last block 84 ms');
    expect(report).toContain('Last 3 frames: 1 dropped · 16.7 16.7 48.3');
  });

  it('describes a live block and a session without blocks', () => {
    expect(buildReport({ ...snapshot, jsBlocked: true, jsStallMs: 120 }, 'd')).toContain(
      'JS thread: blocked for 120 ms',
    );
    expect(buildReport({ ...snapshot, jsLastBlockMs: 0 }, 'd')).toContain(
      'JS thread: idle · no blocks',
    );
  });
});
