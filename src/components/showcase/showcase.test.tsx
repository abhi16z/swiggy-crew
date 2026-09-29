import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { createRef } from 'react';

import type { BottomSheetRef } from '@/components/ui/bottom-sheet/types';
import { ShowcaseSheet } from './showcase';

jest.mock('expo-haptics');

async function renderShowcase() {
  const ref = createRef<BottomSheetRef>();
  const onSnapChange = jest.fn();
  await render(<ShowcaseSheet ref={ref} onSnapChange={onSnapChange} />);
  await fireEvent(screen.root!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
  });
  return { ref, onSnapChange };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ShowcaseSheet', () => {
  it('does not mount the sheet body until the sheet is first opened', async () => {
    await renderShowcase();

    expect(screen.queryByText('Sheet', { includeHiddenElements: true })).not.toBeOnTheScreen();
    expect(
      screen.queryByText('Loading sheet', { includeHiddenElements: true }),
    ).not.toBeOnTheScreen();
  });

  it('loads the body when opened and forwards the snap to the parent', async () => {
    const { ref, onSnapChange } = await renderShowcase();

    await act(async () => ref.current?.snapTo('half'));

    expect(await screen.findByText('Sheet')).toBeVisible();
    expect(onSnapChange).toHaveBeenCalledWith('half');
  });

  it('lets the user move the sheet between stops and close it from inside', async () => {
    const user = userEvent.setup();
    const { ref, onSnapChange } = await renderShowcase();
    await act(async () => ref.current?.snapTo('half'));
    await screen.findByText('Sheet');

    await user.press(screen.getByRole('button', { name: 'Full' }));
    expect(onSnapChange).toHaveBeenLastCalledWith('full');

    await user.press(screen.getByRole('button', { name: 'Middle' }));
    expect(onSnapChange).toHaveBeenLastCalledWith('half');

    await user.press(screen.getByRole('button', { name: 'Close sheet' }));
    expect(onSnapChange).toHaveBeenLastCalledWith('closed');
  });

  it('keeps the body mounted after closing so reopening does not reload it', async () => {
    const { ref } = await renderShowcase();
    await act(async () => ref.current?.snapTo('half'));
    await screen.findByText('Sheet');

    await act(async () => ref.current?.snapTo('closed'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Sheet')).not.toBeOnTheScreen();
    expect(screen.getByText('Sheet', { includeHiddenElements: true })).toBeOnTheScreen();

    await act(async () => ref.current?.snapTo('full'));
    expect(screen.getByText('Sheet')).toBeVisible();
    expect(screen.queryByText('Loading sheet')).not.toBeOnTheScreen();
  });
});
