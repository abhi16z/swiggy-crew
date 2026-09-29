import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';

import { useTripsStore } from '@/components/discover-feed/store';
import { makeTrips } from '@/components/discover-feed/test-data';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/types';

import { FiltersSheet } from './filters-sheet';

jest.mock('expo-haptics');

const mockBodyProps = jest.fn();

// The real body, recording its props so the test can see what the sheet tells it.
jest.mock('./filters-sheet-body', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const Body =
    jest.requireActual<typeof import('./filters-sheet-body')>('./filters-sheet-body').default;
  return {
    __esModule: true,
    default: function RecordingBody(props: Parameters<typeof Body>[0]) {
      mockBodyProps(props);
      return createElement(Body, props);
    },
  };
});

const lastFullHeight = () => mockBodyProps.mock.lastCall?.[0].fullHeight;

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
  mockBodyProps.mockClear();
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

  // No frame drops: rebuilding the feed during the close animation would compete with it.
  it('applies the chosen filters only once the close animation has finished', async () => {
    const trips = makeTrips(4, ['villa', 'experience']);
    useTripsStore.setState({ status: 'success', trips, visibleTrips: trips });
    const ref = await renderFilters();
    await act(async () => ref.current?.snapTo('half'));
    await fireEvent.press(await screen.findByRole('radio', { name: /^Villa/ }));

    await fireEvent.press(screen.getByRole('button', { name: 'Show 2 trips' }));
    expect(useTripsStore.getState()).toMatchObject({
      tripFilter: 'all',
      visibleTrips: trips,
      pendingFilters: { tripFilter: 'villa' },
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(useTripsStore.getState()).toMatchObject({
      tripFilter: 'villa',
      visibleTrips: [trips[0], trips[2]],
      pendingFilters: null,
    });
  });

  it('drops queued filters if the sheet is pulled back up before it closes', async () => {
    const ref = await renderFilters();
    await act(async () => ref.current?.snapTo('half'));
    await fireEvent.press(await screen.findByRole('radio', { name: /^Villa/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Show/ }));

    await act(async () => ref.current?.snapTo('half'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(useTripsStore.getState()).toMatchObject({ tripFilter: 'all', pendingFilters: null });
  });

  // At half the sheet's lower part is off screen, so the body caps itself unless it is full.
  it('tells the body when the sheet is at full height, and when it is back at half', async () => {
    const ref = await renderFilters();
    await act(async () => ref.current?.snapTo('half'));
    await screen.findByText('Trip type');
    expect(lastFullHeight()).toBe(false);

    await act(async () => ref.current?.snapTo('full'));
    expect(lastFullHeight()).toBe(true);

    await act(async () => ref.current?.snapTo('half'));
    expect(lastFullHeight()).toBe(false);
  });
});
