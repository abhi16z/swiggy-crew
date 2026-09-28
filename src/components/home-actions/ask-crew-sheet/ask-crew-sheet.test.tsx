import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { createRef } from 'react';

import type { BottomSheetRef } from '@/components/ui/bottom-sheet';

import { AskCrewSheet } from '.';

jest.mock('expo-haptics');

async function renderAskCrew() {
  const ref = createRef<BottomSheetRef>();
  await render(<AskCrewSheet ref={ref} />);
  await fireEvent(screen.root!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
  });
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

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
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
});
