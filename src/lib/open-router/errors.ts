import type { OpenRouterErrorKind } from './types';

const ERROR_NAME = 'OpenRouterError';

export class OpenRouterError extends Error {
  readonly kind: OpenRouterErrorKind;
  readonly status?: number;

  constructor(kind: OpenRouterErrorKind, message: string, status?: number) {
    super(message);
    this.name = ERROR_NAME;
    this.kind = kind;
    this.status = status;
  }
}

// Checked by name: `instanceof` on transpiled Error subclasses is unreliable across runtimes.
export function isOpenRouterError(error: unknown): error is OpenRouterError {
  return error instanceof Error && error.name === ERROR_NAME;
}

export function kindForStatus(status: number): OpenRouterErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 402) return 'credits';
  if (status === 429) return 'rate-limit';
  if (status >= 400 && status < 500) return 'request';
  if (status >= 500) return 'provider';
  return 'unknown';
}

export function networkError(cause: unknown) {
  return new OpenRouterError('network', cause instanceof Error ? cause.message : String(cause));
}

/** Builds an error from a non-2xx response, using the API's `{ error: { message } }` body. */
export async function errorFromResponse(response: { status: number; text: () => Promise<string> }) {
  let message = `Request failed with status ${response.status}`;
  try {
    const body = JSON.parse(await response.text()) as { error?: { message?: string } };
    if (body.error?.message) message = body.error.message;
  } catch {
    // Not JSON; keep the status message.
  }
  return new OpenRouterError(kindForStatus(response.status), message, response.status);
}

/** Short text for the chat and Settings; the raw API message is shown only when it helps. */
export function describeError(error: unknown) {
  if (!isOpenRouterError(error)) return 'Something went wrong. Please try again.';
  switch (error.kind) {
    case 'auth':
      return 'Your OpenRouter key was rejected. Check it in Settings.';
    case 'credits':
      return 'Your OpenRouter account is out of credits.';
    case 'rate-limit':
      return 'Too many requests right now. Wait a moment and try again.';
    case 'network':
      return 'Could not reach OpenRouter. Check your connection.';
    case 'request':
    case 'provider':
      return error.message;
    default:
      return 'Something went wrong. Please try again.';
  }
}
