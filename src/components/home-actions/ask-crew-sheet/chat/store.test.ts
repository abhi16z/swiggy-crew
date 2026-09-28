import { removeApiKey, saveApiKey } from '@/lib/ai-settings';
import { resetApiKeyStore } from '@/lib/ai-settings/api-key-store';
import { OpenRouterError, streamChat } from '@/lib/open-router';

import { FLUSH_INTERVAL_MS } from './delta-buffer';
import {
  isStreaming,
  openChat,
  resetChats,
  retryReply,
  sendMessage,
  startNewChat,
  stopReply,
  toHistory,
  useChatStore,
} from './store';
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

function activeChat() {
  const { chats, activeChatId } = useChatStore.getState();
  return chats.find((chat) => chat.id === activeChatId);
}

function messages() {
  return activeChat()?.messages ?? [];
}

function chatTitles() {
  return useChatStore.getState().chats.map((chat) => chat.title);
}

async function flushAsync() {
  await Promise.resolve();
  await jest.advanceTimersByTimeAsync(FLUSH_INTERVAL_MS);
}

/** Sends a message and completes its reply with `answer`. */
async function exchange(question: string, answer: string) {
  const stream = controlStream();
  const sent = sendMessage(question);
  await flushAsync();
  stream.options?.onDelta(answer);
  stream.finish();
  await sent;
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.mocked(streamChat).mockReset();
  await saveApiKey('sk-or-v1-test');
});

afterEach(async () => {
  resetChats();
  await resetApiKeyStore();
  jest.useRealTimers();
});

describe('chat store', () => {
  it('starts a chat with the first question and shows an empty streaming reply', async () => {
    controlStream();

    void sendMessage('  Best time for Serengeti?  ');
    await flushAsync();

    expect(activeChat()?.title).toBe('Best time for Serengeti?');
    expect(messages()).toMatchObject([
      { role: 'user', content: 'Best time for Serengeti?', status: 'done' },
      { role: 'assistant', content: '', status: 'streaming' },
    ]);
    expect(isStreaming(activeChat())).toBe(true);
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
    expect(isStreaming(activeChat())).toBe(false);
  });

  it('sends the system prompt and earlier turns of the same chat with a new question', async () => {
    await exchange('Hi', 'Hello!');

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

  it('ignores a new message while the chat is still replying', async () => {
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
    expect(isStreaming(activeChat())).toBe(false);
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

  /** Sends `question` and fails its reply, leaving it as the open chat's last message. */
  async function failedExchange(question: string) {
    const failing = controlStream();
    const sent = sendMessage(question);
    await flushAsync();
    failing.fail(new OpenRouterError('provider', 'Overloaded', 503));
    await sent;
  }

  // Regression: the failed pair was removed before the key was read, so a missing key lost it.
  it('keeps the failed question and reply when a retry cannot send', async () => {
    await failedExchange('Hi');
    await removeApiKey();

    retryReply(messages()[1].id);
    await flushAsync();

    expect(messages()).toMatchObject([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', status: 'error' },
    ]);
  });

  // Regression: the retry used to land in whichever chat was open once the key had loaded.
  it('retries into the failed reply’s own chat even if another chat is opened meanwhile', async () => {
    await failedExchange('Serengeti?');
    const first = activeChat()!;

    controlStream();
    retryReply(first.messages[1].id);
    startNewChat();
    await flushAsync();

    expect(messages()).toEqual([]);
    const retried = useChatStore.getState().chats.find((chat) => chat.id === first.id);
    expect(retried?.messages).toMatchObject([
      { role: 'user', content: 'Serengeti?' },
      { role: 'assistant', status: 'streaming' },
    ]);
  });

  it('only retries the chat’s last message', async () => {
    await failedExchange('Hi');
    const failedId = messages()[1].id;
    await exchange('Again?', 'Yes.');

    retryReply(failedId);
    await flushAsync();

    expect(streamChat).toHaveBeenCalledTimes(2);
    expect(messages().map((message) => message.content)).toEqual(['Hi', '', 'Again?', 'Yes.']);
  });

  it('does nothing without a saved key', async () => {
    await removeApiKey();

    await sendMessage('Hi');

    expect(useChatStore.getState().chats).toEqual([]);
    expect(streamChat).not.toHaveBeenCalled();
  });
});

describe('multiple chats in a session', () => {
  it('keeps the earlier chat when a new chat is started, and lists the latest first', async () => {
    await exchange('Serengeti?', 'Go in July.');

    startNewChat();
    expect(messages()).toEqual([]);
    await exchange('Bodh Gaya?', 'Go in winter.');

    expect(chatTitles()).toEqual(['Bodh Gaya?', 'Serengeti?']);
  });

  it('switches chats; a question sends only its own chat as history', async () => {
    await exchange('Serengeti?', 'Go in July.');
    const first = activeChat()!.id;
    startNewChat();
    await exchange('Bodh Gaya?', 'Go in winter.');

    openChat(first);
    expect(messages().map((message) => message.content)).toEqual(['Serengeti?', 'Go in July.']);

    const next = controlStream();
    void sendMessage('What to pack?');
    await flushAsync();
    expect(next.options?.messages).toEqual([
      { role: 'system', content: 'SYSTEM' },
      { role: 'user', content: 'Serengeti?' },
      { role: 'assistant', content: 'Go in July.' },
      { role: 'user', content: 'What to pack?' },
    ]);
    // Replying moves the chat back to the top of the list.
    expect(chatTitles()).toEqual(['Serengeti?', 'Bodh Gaya?']);
  });

  it('keeps streaming a reply into its own chat after switching to another', async () => {
    const stream = controlStream();
    const sent = sendMessage('Serengeti?');
    await flushAsync();
    const first = activeChat()!.id;

    startNewChat();
    stream.options?.onDelta('Go in July.');
    stream.finish();
    await sent;

    expect(messages()).toEqual([]);
    openChat(first);
    expect(messages()[1]).toMatchObject({ content: 'Go in July.', status: 'done' });
  });

  it('lets a new chat send while another chat is still replying', async () => {
    controlStream();
    void sendMessage('Serengeti?');
    await flushAsync();

    startNewChat();
    controlStream();
    void sendMessage('Bodh Gaya?');
    await flushAsync();

    expect(streamChat).toHaveBeenCalledTimes(2);
    expect(useChatStore.getState().chats.every(isStreaming)).toBe(true);
  });

  it('stops only the open chat’s reply', async () => {
    controlStream();
    void sendMessage('Serengeti?');
    await flushAsync();
    const first = activeChat()!.id;
    startNewChat();
    const second = controlStream();
    const sentSecond = sendMessage('Bodh Gaya?');
    await flushAsync();

    stopReply();
    await sentSecond;

    const firstChat = useChatStore.getState().chats.find((chat) => chat.id === first);
    expect(second.options?.signal?.aborted).toBe(true);
    expect(isStreaming(firstChat)).toBe(true);
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
