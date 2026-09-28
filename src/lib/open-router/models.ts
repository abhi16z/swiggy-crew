import { fetch } from 'expo/fetch';

import { OPEN_ROUTER_API } from './constants';
import { errorFromResponse, isOpenRouterError, networkError, OpenRouterError } from './errors';
import type { OpenRouterModel, RawOpenRouterModel } from './types';

function supportsTextChat(model: RawOpenRouterModel) {
  // `:batch` variants only run through the asynchronous Batch API and cannot stream.
  if (model.id.endsWith(':batch')) return false;
  const input = model.architecture?.input_modalities ?? ['text'];
  const output = model.architecture?.output_modalities ?? ['text'];
  return input.includes('text') && output.includes('text');
}

function toPrice(value: string | undefined) {
  const price = Number(value);
  return Number.isFinite(price) ? price : 0;
}

// `localeCompare` goes through Intl on Hermes, which is slow across hundreds of models; the
// lowercased key sorts by name (then id) with plain comparisons.
function bySearchKey(a: OpenRouterModel, b: OpenRouterModel) {
  if (a.searchKey < b.searchKey) return -1;
  return a.searchKey > b.searchKey ? 1 : 0;
}

/** Keeps models that can chat in text and slims each one to what the picker shows. */
export function toChatModels(raw: RawOpenRouterModel[]): OpenRouterModel[] {
  return raw
    .filter(supportsTextChat)
    .map((model) => {
      const name = model.name ?? model.id;
      return {
        id: model.id,
        name,
        contextLength: model.context_length ?? null,
        promptPrice: toPrice(model.pricing?.prompt),
        completionPrice: toPrice(model.pricing?.completion),
        searchKey: `${name}\n${model.id}`.toLowerCase(),
      };
    })
    .sort(bySearchKey);
}

/** "$1.00 / $5.00 per 1M tokens", "Free", or "Variable price" for routers. */
export function formatPrice(model: Pick<OpenRouterModel, 'promptPrice' | 'completionPrice'>) {
  const { promptPrice, completionPrice } = model;
  if (promptPrice < 0 || completionPrice < 0) return 'Variable price';
  if (promptPrice === 0 && completionPrice === 0) return 'Free';
  const perMillion = (price: number) => `$${(price * 1_000_000).toFixed(2)}`;
  return `${perMillion(promptPrice)} / ${perMillion(completionPrice)} per 1M tokens`;
}

/** Models whose name or id contains `query`, ignoring case and surrounding spaces. */
export function filterModels(models: OpenRouterModel[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return models;
  return models.filter((model) => model.searchKey.includes(needle));
}

async function fetchChatModels() {
  const response = await fetch(`${OPEN_ROUTER_API}/models`).catch((error: unknown) => {
    throw networkError(error);
  });
  if (!response.ok) throw await errorFromResponse(response);
  const body = (await response.json()) as { data?: RawOpenRouterModel[] };
  return toChatModels(body.data ?? []);
}

let cached: Promise<OpenRouterModel[]> | null = null;

/**
 * The full catalog is ~750 KB, so it is fetched once per app session, on first use, and kept
 * slimmed in memory. A failed load is not cached, so the next call retries.
 */
export function loadChatModels() {
  cached ??= fetchChatModels().catch((error: unknown) => {
    cached = null;
    throw isOpenRouterError(error) ? error : new OpenRouterError('unknown', String(error));
  });
  return cached;
}

export function resetChatModelsCache() {
  cached = null;
}
