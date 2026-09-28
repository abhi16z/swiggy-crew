import { FALLBACK_HIGHLIGHT_ICON, HIGHLIGHT_SNAP_INTERVAL } from './constants';
import {
  formatDays,
  formatHighlights,
  formatPrice,
  getActiveHighlight,
  getHighlightIcon,
  getLoaderUri,
} from './utils';

describe('formatPrice', () => {
  it.each([
    [999, '₹999'],
    [34300, '₹34,300'],
    [148000, '₹1,48,000'],
    [10000000, '₹1,00,00,000'],
  ])('groups %d in the Indian style', (amount, expected) => {
    expect(formatPrice({ amount, currency: 'INR' })).toBe(expected);
  });

  it('falls back to the currency code when there is no symbol', () => {
    expect(formatPrice({ amount: 1200, currency: 'USD' })).toBe('USD 1,200');
  });
});

it('uses the singular for a one day trip', () => {
  expect(formatDays(1)).toBe('1 day');
  expect(formatDays(3)).toBe('3 days');
});

it('uses the singular for a trip with one highlight', () => {
  expect(formatHighlights(1)).toBe('1 highlight');
  expect(formatHighlights(3)).toBe('3 highlights');
});

describe('getLoaderUri', () => {
  it('asks ImageKit for a tiny copy of the same image', () => {
    expect(getLoaderUri('https://ik.imagekit.io/a16xyz/crew/1.jpg?tr=w-1280,h-720')).toBe(
      'https://ik.imagekit.io/a16xyz/crew/1.jpg?tr=w-45,h-25',
    );
  });

  it('gives no loader when the url has no size transform', () => {
    expect(getLoaderUri('https://example.com/photo.jpg')).toBeUndefined();
  });
});

describe('getActiveHighlight', () => {
  // 4 cards in a 344pt row: the furthest the row can scroll is 536pt, short of card 4's snap.
  const maxOffsetX = 536;

  it('follows the snapped card', () => {
    expect(getActiveHighlight(0, maxOffsetX, HIGHLIGHT_SNAP_INTERVAL, 4)).toBe(0);
    expect(
      getActiveHighlight(HIGHLIGHT_SNAP_INTERVAL, maxOffsetX, HIGHLIGHT_SNAP_INTERVAL, 4),
    ).toBe(1);
  });

  it('marks the last card once the row reaches its end', () => {
    expect(getActiveHighlight(maxOffsetX, maxOffsetX, HIGHLIGHT_SNAP_INTERVAL, 4)).toBe(3);
  });

  // iOS bounces past the start of the row, so the offset briefly goes negative.
  it('stays on the first card while the row overscrolls its start', () => {
    expect(getActiveHighlight(-40, maxOffsetX, HIGHLIGHT_SNAP_INTERVAL, 4)).toBe(0);
  });

  // One card is narrower than the row, so the row can't scroll and its max offset is negative.
  it('keeps a single highlight active when the row cannot scroll', () => {
    expect(getActiveHighlight(0, -140, HIGHLIGHT_SNAP_INTERVAL, 1)).toBe(0);
  });
});

it('uses a fallback icon for highlight icons it does not know', () => {
  expect(getHighlightIcon('balloon')).toBe(FALLBACK_HIGHLIGHT_ICON);
  expect(getHighlightIcon('boat')).toBe('boat-outline');
});
