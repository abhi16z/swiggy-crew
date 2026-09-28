import { fetch } from 'expo/fetch';

import { isOpenRouterError } from './errors';
import { streamChat } from './stream-chat';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const mockFetch = jest.mocked(fetch);

/** A 200 response whose body yields `bytes` split at the given byte offsets. */
function streamingResponse(text: string, splitAt: number[] = []) {
  const bytes = new TextEncoder().encode(text);
  const bounds = [0, ...splitAt, bytes.length];
  const chunks = bounds.slice(1).map((end, i) => bytes.slice(bounds[i], end));
  const cancel = jest.fn(() => Promise.resolve());
  const response = {
    ok: true,
    status: 200,
    text: async () => '',
    body: {
      getReader: () => ({
        read: async () =>
          chunks.length > 0
            ? { done: false, value: chunks.shift() }
            : { done: true, value: undefined },
        cancel,
      }),
    },
  };
  return { response: response as never, cancel };
}

function errorResponse(status: number, body: string) {
  return { ok: false, status, text: async () => body } as never;
}

function delta(content: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

async function run(signal?: AbortSignal) {
  const deltas: string[] = [];
  await streamChat({
    apiKey: 'sk-or-test',
    model: 'anthropic/claude-opus-5',
    messages: [{ role: 'user', content: 'Hi' }],
    signal,
    onDelta: (text) => deltas.push(text),
  });
  return deltas;
}

async function runError() {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error('expected streamChat to reject');
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('streamChat', () => {
  it('posts a streaming chat completion with the key, model and messages', async () => {
    mockFetch.mockResolvedValue(streamingResponse('data: [DONE]\n\n').response);

    await run();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer sk-or-test' });
    expect(JSON.parse(String(init?.body))).toEqual({
      model: 'anthropic/claude-opus-5',
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
    });
  });

  it('reports each text delta in order as it arrives', async () => {
    const keepAlive = ': OPENROUTER PROCESSING\n\n';
    const body = `${keepAlive}${delta('Hel')}${delta('lo')}${delta('')}data: [DONE]\n\n`;
    mockFetch.mockResolvedValue(streamingResponse(body, [10, 40, 75]).response);

    expect(await run()).toEqual(['Hel', 'lo']);
  });

  it('decodes a multi-byte character split across network chunks', async () => {
    const body = `${delta('Café ☕')}data: [DONE]\n\n`;
    const splitInsideCoffee = new TextEncoder().encode(body).indexOf(0xe2) + 1;
    mockFetch.mockResolvedValue(streamingResponse(body, [splitInsideCoffee]).response);

    expect((await run()).join('')).toBe('Café ☕');
  });

  it('releases the connection once [DONE] arrives', async () => {
    const { response, cancel } = streamingResponse(`${delta('a')}data: [DONE]\n\n`);
    mockFetch.mockResolvedValue(response);

    await run();

    expect(cancel).toHaveBeenCalled();
  });

  it('rejects with the API message when the request is refused', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(401, '{"error":{"message":"User not found.","code":401}}'),
    );

    const error = await runError();

    expect(isOpenRouterError(error) && error.kind).toBe('auth');
    expect((error as Error).message).toBe('User not found.');
  });

  it('rejects when the provider fails mid-stream, after delivering earlier text', async () => {
    const failure = `data: ${JSON.stringify({ error: { message: 'Provider disconnected' } })}\n\n`;
    mockFetch.mockResolvedValue(streamingResponse(`${delta('Par')}${failure}`).response);
    const deltas: string[] = [];

    const result = streamChat({
      apiKey: 'k',
      model: 'm',
      messages: [],
      onDelta: (text) => deltas.push(text),
    });

    await expect(result).rejects.toThrow('Provider disconnected');
    expect(deltas).toEqual(['Par']);
  });

  it('reports a network error when the connection fails', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    const error = await runError();

    expect(isOpenRouterError(error) && error.kind).toBe('network');
  });

  it('passes an abort through unchanged so callers can tell it from a failure', async () => {
    const controller = new AbortController();
    const abortError = new Error('The operation was aborted.');
    mockFetch.mockImplementation(async () => {
      controller.abort();
      throw abortError;
    });

    await expect(run(controller.signal)).rejects.toBe(abortError);
  });
});
