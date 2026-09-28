import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';

import { useTripsStore } from '@/components/discover-feed/store';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet';

import { FiltersSheet } from '.';

jest.mock('expo-haptics');

async function renderFilters() {
  const ref = createRef<BottomSheetRef>();
  await render(<FiltersSheet ref={ref} />);
  await fireEvent(screen.root!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
  });
  return ref;
}

beforeEach(() => {
  jest.useFakeTimers();
  useTripsStore.setState(useTripsStore.getInitialState());
});

afterEach(() => {
  jest.useRealTimers();
});

describe('FiltersSheet', () => {
  it('does not mount the body until the sheet is first opened', async () => {
    await renderFilters();

    expect(screen.queryByText('Trip type', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('keeps the body mounted after closing so reopening does not reload it', async () => {
    const ref = await renderFilters();
    await act(async () => ref.current?.snapTo('half'));
    await screen.findByText('Trip type');

    await act(async () => ref.current?.snapTo('closed'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Trip type', { includeHiddenElements: true })).toBeOnTheScreen();

    await act(async () => ref.current?.snapTo('half'));
    expect(screen.getByText('Trip type')).toBeVisible();
    expect(screen.queryByText('Loading filters')).not.toBeOnTheScreen();
  });

  // Closing with the X or a swipe means "never mind": reopening shows the applied type again.
  it('drops a choice that was not applied once the sheet has closed', async () => {
    const ref = await renderFilters();
    await act(async () => ref.current?.snapTo('half'));
    await fireEvent.press(await screen.findByRole('radio', { name: /^Villa/ }));
    expect(screen.getByRole('radio', { name: /^Villa/ })).toBeChecked();

    await act(async () => ref.current?.snapTo('closed'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => ref.current?.snapTo('half'));

    expect(screen.getByRole('radio', { name: /^All trips/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /^Villa/ })).not.toBeChecked();
    expect(useTripsStore.getState().tripFilter).toBe('all');
  });
});
