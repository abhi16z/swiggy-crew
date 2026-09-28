import type { RemoteUri } from '@/components/ui/remote-image';

import { FALLBACK_HIGHLIGHT_ICON, HIGHLIGHT_ICONS, LOADER_TRANSFORM } from './constants';
import type { TripBundle } from './types';

const CURRENCY_SYMBOLS: Partial<Record<string, string>> = { INR: '₹' };

// Indian digit grouping (1,48,000) by hand: no Intl formatter to build per card on Hermes.
function groupIndian(amount: number) {
  const digits = String(Math.round(amount));
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

export function formatPrice({ amount, currency }: TripBundle['price']) {
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? `${symbol}${groupIndian(amount)}` : `${currency} ${groupIndian(amount)}`;
}

export function formatDays(days: number) {
  return days === 1 ? '1 day' : `${days} days`;
}

export function formatHighlights(count: number) {
  return count === 1 ? '1 highlight' : `${count} highlights`;
}

/** The same ImageKit image at 45x25, or `undefined` when the url has no size transform. */
export function getLoaderUri(url: string): RemoteUri | undefined {
  const loader = url.replace(/tr=w-\d+,h-\d+/, LOADER_TRANSFORM);
  if (loader === url || !loader.startsWith('https://')) return undefined;
  return loader as RemoteUri;
}

export function getHighlightIcon(icon: string) {
  return HIGHLIGHT_ICONS[icon as keyof typeof HIGHLIGHT_ICONS] ?? FALLBACK_HIGHLIGHT_ICON;
}

/**
 * Index of the highlight the row is showing. The last card can't scroll to the left edge,
 * so reaching the end of the row counts as the last one.
 */
export function getActiveHighlight(
  offsetX: number,
  maxOffsetX: number,
  interval: number,
  count: number,
) {
  'worklet';
  if (count <= 1) return 0;
  if (offsetX >= maxOffsetX - 1) return count - 1;
  return Math.min(count - 1, Math.max(0, Math.round(offsetX / interval)));
}
