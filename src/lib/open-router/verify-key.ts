import { fetch } from 'expo/fetch';

import { OPEN_ROUTER_API } from './constants';
import { errorFromResponse, networkError } from './errors';

/** Resolves if OpenRouter accepts the key (`GET /key`); rejects with `OpenRouterError` if not. */
export async function verifyKey(apiKey: string) {
  const response = await fetch(`${OPEN_ROUTER_API}/key`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  }).catch((error: unknown) => {
    throw networkError(error);
  });
  if (!response.ok) throw await errorFromResponse(response);
}
