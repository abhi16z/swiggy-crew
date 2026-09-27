import { CLOSED_GAP } from './constants';
import { halfOffset, nearestOffset, neighborOffset, offsetFor, resist, snapIndex } from './utils';

// A phone-sized parent: 800pt tall with a 40pt status bar.
const HEIGHT = 800;
const TOP = 40;
const FULL = 0;
const HALF = HEIGHT / 2 - TOP; // 360
const CLOSED = HEIGHT - TOP + CLOSED_GAP; // 800

describe('offsetFor', () => {
  it('maps every snap to its resting translateY', () => {
    expect(offsetFor(snapIndex('full'), HEIGHT, TOP)).toBe(FULL);
    expect(offsetFor(snapIndex('half'), HEIGHT, TOP)).toBe(HALF);
    expect(offsetFor(snapIndex('closed'), HEIGHT, TOP)).toBe(CLOSED);
  });

  it('parks the closed sheet fully below the parent so its shadow is not visible', () => {
    // The sheet is positioned at `top: insets.top`, so HEIGHT - TOP puts its top edge at the
    // bottom of the parent; the extra gap hides the upward shadow.
    expect(offsetFor(snapIndex('closed'), HEIGHT, TOP)).toBeGreaterThan(HEIGHT - TOP);
  });

  it('never places the half stop above the full stop on very short parents', () => {
    expect(halfOffset(60, 44)).toBe(0);
  });
});

describe('nearestOffset (slow release)', () => {
  it.each([
    ['just below full', 50, FULL],
    ['just above half', 300, HALF],
    ['just below half', 420, HALF],
    ['closer to closed', 700, CLOSED],
  ])('settles %s at the closest stop', (_, projected, expected) => {
    expect(nearestOffset(projected, FULL, HALF, CLOSED)).toBe(expected);
  });
});

describe('neighborOffset (flick)', () => {
  it('flick up from half goes to full', () => {
    expect(neighborOffset(HALF, -1, FULL, HALF, CLOSED)).toBe(FULL);
  });

  it('flick up from between half and closed stops at half, not full', () => {
    expect(neighborOffset(600, -1, FULL, HALF, CLOSED)).toBe(HALF);
  });

  it('flick down from full goes to half', () => {
    expect(neighborOffset(FULL, 1, FULL, HALF, CLOSED)).toBe(HALF);
  });

  it('flick down from half closes the sheet', () => {
    expect(neighborOffset(HALF, 1, FULL, HALF, CLOSED)).toBe(CLOSED);
  });

  it('stays put when there is no stop left in the flick direction', () => {
    expect(neighborOffset(FULL, -1, FULL, HALF, CLOSED)).toBe(FULL);
    expect(neighborOffset(CLOSED, 1, FULL, HALF, CLOSED)).toBe(CLOSED);
  });

  it('treats sub-pixel drift at a stop as being at that stop', () => {
    // A flick down released 0.3pt below half must not count half as "the next stop down".
    expect(neighborOffset(HALF + 0.3, 1, FULL, HALF, CLOSED)).toBe(CLOSED);
    expect(neighborOffset(HALF - 0.3, -1, FULL, HALF, CLOSED)).toBe(FULL);
  });
});

describe('resist (rubber band while dragging)', () => {
  it('follows the finger exactly inside the travel range', () => {
    expect(resist(250, FULL, CLOSED, HEIGHT)).toBe(250);
  });

  it('dampens overdrag past full and past closed', () => {
    const overTop = resist(-200, FULL, CLOSED, HEIGHT);
    expect(overTop).toBeLessThan(FULL);
    expect(overTop).toBeGreaterThan(-200);

    const overBottom = resist(CLOSED + 200, FULL, CLOSED, HEIGHT);
    expect(overBottom).toBeGreaterThan(CLOSED);
    expect(overBottom).toBeLessThan(CLOSED + 200);
  });

  it('never lets the sheet travel more than one band past the edge', () => {
    expect(resist(-1_000_000, FULL, CLOSED, HEIGHT)).toBeGreaterThan(FULL - HEIGHT);
  });

  it('returns a finite value before layout has measured the parent', () => {
    expect(Number.isFinite(resist(-50, 0, 40, 0))).toBe(true);
  });
});
