import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { createRef } from 'react';
import { Keyboard } from 'react-native';

import type { BottomSheetRef } from '@/components/ui/bottom-sheet';
import { halfOffset } from '@/components/ui/bottom-sheet/utils';
import { saveApiKey } from '@/lib/ai-settings';
import { resetApiKeyStore } from '@/lib/ai-settings/api-key-store';

import { AskCrewSheet } from '.';

jest.mock('expo-haptics');
jest.mock('./chat/destinations', () => ({ loadDestinations: async () => [] }));

const SCREEN_HEIGHT = 800;
// Test safe-area insets are zero.
const PEEK_INSET = halfOffset(SCREEN_HEIGHT, 0);

async function renderAskCrew() {
  const ref = createRef<BottomSheetRef>();
  await render(<AskCrewSheet ref={ref} />);
  await fireEvent(screen.root!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: SCREEN_HEIGHT } },
  });
  return ref;
}

async function openAtHalf() {
  const ref = await renderAskCrew();
  await act(async () => ref.current?.snapTo('half'));
  await screen.findByText('Ask Crew');
  return ref;
}

async function finishAnimations() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

function queryBody() {
  return screen.queryByText('Ask Crew', { includeHiddenElements: true });
}

const content = () => screen.getByTestId('ask-crew-content');

beforeEach(async () => {
  jest.useFakeTimers();
  await saveApiKey('sk-or-v1-test');
});

afterEach(async () => {
  jest.restoreAllMocks();
  await resetApiKeyStore();
  jest.useRealTimers();
});

describe('AskCrewSheet', () => {
  it('does not mount the body until the sheet is first opened', async () => {
    await renderAskCrew();

    expect(queryBody()).not.toBeOnTheScreen();
  });

  it('keeps the body while closing and unmounts it once the close animation finishes', async () => {
    const user = userEvent.setup();
    const ref = await renderAskCrew();
    await act(async () => ref.current?.snapTo('half'));
    expect(await screen.findByText('Ask Crew')).toBeVisible();

    await user.press(screen.getByRole('button', { name: 'Close Ask Crew' }));
    expect(queryBody()).toBeOnTheScreen();

    await finishAnimations();
    expect(queryBody()).not.toBeOnTheScreen();
  });

  it('loads the body again when reopened after closing', async () => {
    const ref = await renderAskCrew();
    await act(async () => ref.current?.snapTo('half'));
    await screen.findByText('Ask Crew');
    await act(async () => ref.current?.snapTo('closed'));
    await finishAnimations();

    await act(async () => ref.current?.snapTo('full'));

    expect(await screen.findByText('Ask Crew')).toBeVisible();
  });

  // At half the sheet's lower part is off screen and the composer is lifted over it, so the
  // content must end above the composer there, and use the whole body at full height.
  it('ends the content above the lifted composer at half height, and not at full', async () => {
    const ref = await openAtHalf();
    expect(content()).toHaveStyle({ marginBottom: PEEK_INSET });

    await act(async () => ref.current?.snapTo('full'));

    expect(content()).toHaveStyle({ marginBottom: 0 });
  });

  // The input only follows the keyboard at full height, so touching it expands the sheet
  // before the keyboard opens.
  it.each(['pressIn', 'focus'])('expands to full height on composer %s', async (event) => {
    await openAtHalf();

    await fireEvent(screen.getByLabelText('Message Crew'), event);

    expect(content()).toHaveStyle({ marginBottom: 0 });
  });

  it('dismisses the keyboard when the sheet leaves full height, but not when it expands', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const ref = await openAtHalf();
    await act(async () => ref.current?.snapTo('full'));
    dismiss.mockClear();

    await act(async () => ref.current?.snapTo('half'));
    expect(dismiss).toHaveBeenCalledTimes(1);

    dismiss.mockClear();
    await act(async () => ref.current?.snapTo('full'));
    expect(dismiss).not.toHaveBeenCalled();
  });
});
