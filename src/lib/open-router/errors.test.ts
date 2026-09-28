import {
  describeError,
  errorFromResponse,
  isOpenRouterError,
  kindForStatus,
  networkError,
  OpenRouterError,
} from './errors';

function response(status: number, body: string) {
  return { status, text: async () => body };
}

describe('kindForStatus', () => {
  it.each([
    [401, 'auth'],
    [403, 'auth'],
    [402, 'credits'],
    [429, 'rate-limit'],
    [400, 'request'],
    [404, 'request'],
    [500, 'provider'],
    [503, 'provider'],
    [302, 'unknown'],
  ])('maps status %i to %s', (status, kind) => {
    expect(kindForStatus(status)).toBe(kind);
  });
});

describe('errorFromResponse', () => {
  it('uses the API error message when the body has one', async () => {
    const error = await errorFromResponse(
      response(402, JSON.stringify({ error: { message: 'Insufficient credits' } })),
    );

    expect(error).toMatchObject({ kind: 'credits', status: 402, message: 'Insufficient credits' });
  });

  it('falls back to the status when the body is not JSON', async () => {
    const error = await errorFromResponse(response(502, '<html>Bad gateway</html>'));

    expect(error).toMatchObject({
      kind: 'provider',
      message: 'Request failed with status 502',
    });
  });
});

describe('describeError', () => {
  it.each([
    ['auth', 'Your OpenRouter key was rejected. Check it in Settings.'],
    ['credits', 'Your OpenRouter account is out of credits.'],
    ['rate-limit', 'Too many requests right now. Wait a moment and try again.'],
    ['network', 'Could not reach OpenRouter. Check your connection.'],
    ['unknown', 'Something went wrong. Please try again.'],
  ] as const)('gives a fixed message for %s errors', (kind, message) => {
    expect(describeError(new OpenRouterError(kind, 'raw API text'))).toBe(message);
  });

  // For these the API's own message is the most useful thing to show.
  it.each(['request', 'provider'] as const)('shows the API message for %s errors', (kind) => {
    expect(describeError(new OpenRouterError(kind, 'Model is overloaded'))).toBe(
      'Model is overloaded',
    );
  });

  it('gives the generic message for errors that are not from OpenRouter', () => {
    expect(describeError(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(describeError('boom')).toBe('Something went wrong. Please try again.');
  });
});

describe('networkError', () => {
  it('wraps a failed fetch as a network error that isOpenRouterError recognises', () => {
    const error = networkError(new TypeError('Network request failed'));

    expect(isOpenRouterError(error)).toBe(true);
    expect(error).toMatchObject({ kind: 'network', message: 'Network request failed' });
  });
});
