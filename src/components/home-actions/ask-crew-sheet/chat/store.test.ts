import { removeApiKey, saveApiKey } from '@/lib/ai-settings';
import { resetApiKeyStore } from '@/lib/ai-settings/api-key-store';
import { OpenRouterError, streamChat } from '@/lib/open-router';

import { FLUSH_INTERVAL_MS } from './delta-buffer';
import { clearChat, retryReply, sendMessage, stopReply, toHistory, useChatStore } from './store';
import type { ChatMessage } from './types';

jest.mock('@/lib/open-router', () => ({
  ...jest.requireActual<typeof import('@/lib/open-router')>('@/lib/open-router'),
  streamChat: jest.fn(),
}));

jest.mock('./system-prompt', () => ({ buildSystemPrompt: async () => 'SYSTEM' }));

type ControlledStream = {
  options: Parameters<typeof streamChat>[0] | null;
  finish: () => void;
  fail: (error: unknown) => void;
};

/** Lets a test drive one streamed reply by hand. */
function controlStream() {
  const stream: ControlledStream = { options: null, finish: () => {}, fail: () => {} };
  jest.mocked(streamChat).mockImplementationOnce(
    (options) =>
      new Promise<void>((resolve, reject) => {
        stream.options = options;
        stream.finish = resolve;
        stream.fail = reject;
        options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
  return stream;
}

function messages() {
  return useChatStore.getState().messages;
}

async function flushAsync() {
  await Promise.resolve();
  await jest.advanceTimersByTimeAsync(FLUSH_INTERVAL_MS);
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.mocked(streamChat).mockReset();
  await saveApiKey('sk-or-v1-test');
});

afterEach(async () => {
  clearChat();
  await resetApiKeyStore();
  jest.useRealTimers();
});

describe('chat store', () => {
  it('shows the question and an empty streaming reply before the first token', async () => {
    controlStream();

    void sendMessage('  Best time for Serengeti?  ');
    await flushAsync();

    expect(messages()).toMatchObject([
      { role: 'user', content: 'Best time for Serengeti?', status: 'done' },
      { role: 'assistant', content: '', status: 'streaming' },
    ]);
    expect(useChatStore.getState().streaming).toBe(true);
  });

  it('streams text into the reply progressively, then marks it done', async () => {
    const stream = controlStream();
    const sent = sendMessage('Hi');
    await flushAsync();

    stream.options?.onDelta('June to ');
    await flushAsync();
    expect(messages()[1].content).toBe('June to ');

    stream.options?.onDelta('October.');
    stream.finish();
    await sent;

    expect(messages()[1]).toMatchObject({ content: 'June to October.', status: 'done' });
    expect(useChatStore.getState().streaming).toBe(false);
  });

  it('sends the system prompt and earlier turns with a new question', async () => {
    const first = controlStream();
    const sent = sendMessage('Hi');
    await flushAsync();
    first.options?.onDelta('Hello!');
    first.finish();
    await sent;

    const second = controlStream();
    void sendMessage('And food?');
    await flushAsync();

    expect(second.options?.messages).toEqual([
      { role: 'system', content: 'SYSTEM' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'And food?' },
    ]);
  });

  it('ignores a new message while a reply is still streaming', async () => {
    controlStream();
    void sendMessage('One');
    await flushAsync();

    await sendMessage('Two');

    expect(messages()).toHaveLength(2);
    expect(streamChat).toHaveBeenCalledTimes(1);
  });

  it('keeps the partial text when the user stops a reply', async () => {
    const stream = controlStream();
    const sent = sendMessage('Hi');
    await flushAsync();
    stream.options?.onDelta('Partial');

    stopReply();
    await sent;

    expect(messages()[1]).toMatchObject({ content: 'Partial', status: 'stopped' });
    expect(useChatStore.getState().streaming).toBe(false);
  });

  it('shows why a reply failed and can retry it', async () => {
    const failing = controlStream();
    const sent = sendMessage('Hi');
    await flushAsync();
    failing.fail(new OpenRouterError('credits', 'Insufficient credits', 402));
    await sent;

    expect(messages()[1]).toMatchObject({
      status: 'error',
      error: 'Your OpenRouter account is out of credits.',
    });

    controlStream();
    retryReply(messages()[1].id);
    await flushAsync();

    expect(messages()).toMatchObject([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', status: 'streaming' },
    ]);
  });

  it('does nothing without a saved key', async () => {
    await removeApiKey();

    await sendMessage('Hi');

    expect(messages()).toEqual([]);
    expect(streamChat).not.toHaveBeenCalled();
  });
});

describe('toHistory', () => {
  const message = (overrides: Partial<ChatMessage>): ChatMessage => ({
    id: 'x',
    role: 'user',
    content: 'text',
    status: 'done',
    ...overrides,
  });

  it('drops failed and empty replies but keeps stopped partial text', () => {
    expect(
      toHistory([
        message({ content: 'Q1' }),
        message({ role: 'assistant', content: 'oops', status: 'error' }),
        message({ role: 'assistant', content: '', status: 'stopped' }),
        message({ role: 'assistant', content: 'Half an answer', status: 'stopped' }),
      ]),
    ).toEqual([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'Half an answer' },
    ]);
  });

  it('sends at most the 20 most recent messages', () => {
    const long = Array.from({ length: 30 }, (_, i) => message({ content: `m${i}` }));

    const history = toHistory(long);

    expect(history).toHaveLength(20);
    expect(history[0].content).toBe('m10');
  });
});
