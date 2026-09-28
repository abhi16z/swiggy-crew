import { fetch } from 'expo/fetch';

import { OPEN_ROUTER_API } from './constants';
import { errorFromResponse, isOpenRouterError, networkError, OpenRouterError } from './errors';
import { createSseParser } from './sse';
import type { ChatCompletionChunk, ChatMessageParam } from './types';

export type StreamChatOptions = {
  apiKey: string;
  model: string;
  messages: ChatMessageParam[];
  signal?: AbortSignal;
  /** Called with each piece of text as the model produces it. */
  onDelta: (text: string) => void;
};

const DONE = '[DONE]';

function parseChunk(data: string): ChatCompletionChunk | null {
  try {
    return JSON.parse(data) as ChatCompletionChunk;
  } catch {
    return null;
  }
}

/**
 * Streams a chat completion from OpenRouter (`stream: true`, server-sent events) and reports
 * text as it arrives. Resolves when the stream ends; rejects with `OpenRouterError` for API
 * errors (including errors sent mid-stream) and connection failures, and with the fetch error
 * when `signal` aborts.
 */
export async function streamChat(options: StreamChatOptions) {
  try {
    await readStream(options);
  } catch (error) {
    // Aborts and API errors pass through; anything else is the connection failing.
    if (options.signal?.aborted || isOpenRouterError(error)) throw error;
    throw networkError(error);
  }
}

async function readStream({ apiKey, model, messages, signal, onDelta }: StreamChatOptions) {
  const response = await fetch(`${OPEN_ROUTER_API}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });
  if (!response.ok) throw await errorFromResponse(response);

  const reader = response.body?.getReader();
  if (!reader) throw new OpenRouterError('network', 'The response had no body to stream.');

  let finished = false;
  const parser = createSseParser((data) => {
    if (data === DONE) {
      finished = true;
      return;
    }
    const chunk = parseChunk(data);
    if (chunk?.error) {
      const message = chunk.error.message ?? 'The model stopped with an error.';
      throw new OpenRouterError('provider', message);
    }
    const text = chunk?.choices?.[0]?.delta?.content;
    if (text) onDelta(text);
  });

  const decoder = new TextDecoder();
  try {
    while (!finished) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
    if (!finished) {
      parser.push(decoder.decode());
      parser.end();
    }
  } finally {
    // Releases the connection after `[DONE]` or a mid-stream error; a no-op once it has ended.
    reader.cancel().catch(() => {});
  }
}
