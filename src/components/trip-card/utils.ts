import { FALLBACK_HIGHLIGHT_ICON, HIGHLIGHT_ICONS } from './constants';
import type { TripBundle, TripBundleData } from './types';

const CURRENCY_SYMBOLS: Partial<Record<string, string>> = { INR: '₹' };

// Indian digit grouping (1,48,000) by hand: no Intl formatter to build per card on Hermes.
function groupIndian(amount: number) {
  const digits = String(Math.round(amount));
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

export function formatPrice({ amount, currency }: TripBundleData['price']) {
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? `${symbol}${groupIndian(amount)}` : `${currency} ${groupIndian(amount)}`;
}

export function formatDays(days: number) {
  return days === 1 ? '1 day' : `${days} days`;
}

export function formatHighlights(count: number) {
  return count === 1 ? '1 highlight' : `${count} highlights`;
}

/** The trip with its card text formatted, so a card only reads strings while scrolling. */
export function withLabels(trip: TripBundleData): TripBundle {
  const { destination, country, price, duration, rating, highlights } = trip;
  const ratingText = rating.toFixed(1);
  return {
    ...trip,
    labels: {
      price: formatPrice(price),
      duration: `${formatDays(duration.days)} · per person`,
      rating: ratingText,
      ratingA11y: `Rated ${ratingText} out of 5`,
      image: `${destination}, ${country}`,
      details: `Details for ${destination}`,
      highlights: formatHighlights(highlights.length),
    },
  };
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
