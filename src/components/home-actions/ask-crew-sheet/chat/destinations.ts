import { fetch } from 'expo/fetch';

import { TRAVEL_BUNDLES_URL } from './constants';

type Bundle = { destination?: unknown; country?: unknown };

/** Unique "Destination (Country)" labels, in feed order. */
export function toDestinationList(bundles: unknown): string[] {
  if (!Array.isArray(bundles)) return [];
  const labels = new Set<string>();
  for (const bundle of bundles as Bundle[]) {
    if (typeof bundle?.destination !== 'string' || bundle.destination.trim() === '') continue;
    const country = typeof bundle.country === 'string' ? bundle.country.trim() : '';
    const name = bundle.destination.trim();
    labels.add(country ? `${name} (${country})` : name);
  }
  return [...labels];
}

let cached: Promise<string[]> | null = null;

/**
 * Destinations offered in the feed, for the assistant's system prompt. Fetched once per app
 * session; a failed load resolves to an empty list (the chat still works) and is retried on
 * the next call.
 */
export function loadDestinations() {
  cached ??= fetch(TRAVEL_BUNDLES_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return response.json();
    })
    .then(toDestinationList)
    .catch(() => {
      cached = null;
      return [];
    });
  return cached;
}

export function resetDestinationsCache() {
  cached = null;
}
