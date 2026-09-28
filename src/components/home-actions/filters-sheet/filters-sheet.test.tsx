import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';

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
});

afterEach(() => {
  jest.useRealTimers();
});

describe('FiltersSheet', () => {
  it('does not mount the body until the sheet is first opened', async () => {
    await renderFilters();

    expect(screen.queryByText('Filters', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('keeps the body mounted after closing so reopening does not reload it', async () => {
    const ref = await renderFilters();
    await act(async () => ref.current?.snapTo('half'));
    await screen.findByText('Filters');

    await act(async () => ref.current?.snapTo('closed'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Filters', { includeHiddenElements: true })).toBeOnTheScreen();

    await act(async () => ref.current?.snapTo('half'));
    expect(screen.getByText('Filters')).toBeVisible();
    expect(screen.queryByText('Loading filters')).not.toBeOnTheScreen();
  });
});
