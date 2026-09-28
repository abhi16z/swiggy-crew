export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessageParam = {
  role: ChatRole;
  content: string;
};

export type OpenRouterModel = {
  id: string;
  name: string;
  contextLength: number | null;
  /** USD per token; negative means the price depends on the model routed to. */
  promptPrice: number;
  completionPrice: number;
};

export type OpenRouterErrorKind =
  | 'auth'
  | 'credits'
  | 'rate-limit'
  | 'request'
  | 'provider'
  | 'network'
  | 'unknown';

/** Shape of `GET /models` entries that the app reads. */
export type RawOpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number | null;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
};

/** Shape of one streamed `chat.completion.chunk` that the app reads. */
export type ChatCompletionChunk = {
  error?: { message?: string; code?: number | string };
  choices?: { delta?: { content?: string | null } }[];
};
