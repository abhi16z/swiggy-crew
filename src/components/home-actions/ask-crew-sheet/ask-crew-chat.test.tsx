import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { createRef } from 'react';

import type { BottomSheetRef } from '@/components/ui/bottom-sheet';
import { removeApiKey, saveApiKey } from '@/lib/ai-settings';
import { resetApiKeyStore } from '@/lib/ai-settings/api-key-store';
import { streamChat } from '@/lib/open-router';

import { AskCrewSheet } from '.';
import { FLUSH_INTERVAL_MS } from './chat/delta-buffer';
import { resetChats } from './chat/store';

jest.mock('expo-haptics');

jest.mock('@/lib/open-router', () => ({
  ...jest.requireActual<typeof import('@/lib/open-router')>('@/lib/open-router'),
  streamChat: jest.fn(),
}));

jest.mock('./chat/system-prompt', () => ({ buildSystemPrompt: async () => 'SYSTEM' }));
jest.mock('./chat/destinations', () => ({ loadDestinations: async () => [] }));

type StreamOptions = Parameters<typeof streamChat>[0];

/** Hands the test the `onDelta` of the next request and a way to end it. */
function controlStream() {
  const stream: { options: StreamOptions | null; finish: () => void } = {
    options: null,
    finish: () => {},
  };
  jest.mocked(streamChat).mockImplementationOnce(
    (options) =>
      new Promise<void>((resolve, reject) => {
        stream.options = options;
        stream.finish = resolve;
        options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
  return stream;
}

async function openSheet() {
  const ref = createRef<BottomSheetRef>();
  await render(<AskCrewSheet ref={ref} />);
  await fireEvent(screen.root!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
  });
  await act(async () => ref.current?.snapTo('half'));
  await screen.findByText('Ask Crew');
  return ref;
}

async function tick(ms = FLUSH_INTERVAL_MS) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

async function send(text: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Message Crew'), text);
  await user.press(screen.getByRole('button', { name: 'Send message' }));
  await tick();
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

describe('Ask Crew chat', () => {
  it('shows a loading indicator until the first token, then streams the reply in', async () => {
    const stream = controlStream();
    await openSheet();

    await send('Best time for Serengeti?');
    expect(screen.getByText('Best time for Serengeti?')).toBeOnTheScreen();
    expect(screen.getByLabelText('Crew is thinking')).toBeOnTheScreen();

    await act(async () => stream.options?.onDelta('June to '));
    await tick();
    expect(screen.queryByLabelText('Crew is thinking')).not.toBeOnTheScreen();
    // Queries match trimmed text.
    expect(screen.getByText('June to')).toBeOnTheScreen();

    await act(async () => stream.options?.onDelta('October.'));
    await tick();
    expect(screen.getByText('June to October.')).toBeOnTheScreen();
  });

  it('keeps the conversation after the sheet is closed and reopened', async () => {
    const stream = controlStream();
    const ref = await openSheet();
    await send('Hi');
    await act(async () => {
      stream.options?.onDelta('Hello!');
      stream.finish();
    });
    await tick();

    await act(async () => ref.current?.snapTo('closed'));
    await tick(1000);
    expect(screen.queryByText('Hello!', { includeHiddenElements: true })).not.toBeOnTheScreen();

    await act(async () => ref.current?.snapTo('half'));
    expect(await screen.findByText('Hello!')).toBeOnTheScreen();
    expect(screen.getByText('Hi')).toBeOnTheScreen();
  });

  it('lets the user stop a reply and keeps what arrived', async () => {
    const stream = controlStream();
    await openSheet();
    await send('Plan a trip');
    await act(async () => stream.options?.onDelta('Day 1:'));
    await tick();

    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Stop reply' }));
    await tick();

    expect(screen.getByText('Day 1:')).toBeOnTheScreen();
    expect(screen.getByText('Stopped')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeOnTheScreen();
  });

  it('starts a new chat and switches back to the earlier one from All chats', async () => {
    const user = userEvent.setup();
    const first = controlStream();
    await openSheet();
    expect(screen.queryByRole('button', { name: 'All chats' })).not.toBeOnTheScreen();
    await send('Serengeti?');
    await act(async () => {
      first.options?.onDelta('Go in July.');
      first.finish();
    });
    await tick();

    await user.press(screen.getByRole('button', { name: 'Start a new chat' }));
    expect(screen.queryByText('Go in July.')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'All chats' }));
    expect(screen.getByText('All chats')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Message Crew')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Serengeti?. Go in July.' }));

    expect(screen.getByText('Go in July.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Message Crew')).toBeOnTheScreen();
  });

  it('points to Settings when no OpenRouter key is saved', async () => {
    await removeApiKey();
    await openSheet();

    expect(await screen.findByRole('button', { name: 'Open Settings' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Message Crew')).not.toBeEnabled();
  });
});
