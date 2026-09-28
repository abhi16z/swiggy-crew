import { render, screen, userEvent } from '@testing-library/react-native';

import { useTripsStore } from '@/components/discover-feed/store';
import { makeTrips } from '@/components/discover-feed/test-data';

import FiltersSheetBody from './filters-sheet-body';

const onSnapTo = jest.fn();

// 6 trips: 3 villas, 2 flight + stay, 1 experience.
const trips = makeTrips(6, ['villa', 'flight_stay', 'villa', 'experience', 'villa', 'flight_stay']);

beforeEach(() => {
  jest.clearAllMocks();
  useTripsStore.setState({
    ...useTripsStore.getInitialState(),
    status: 'success',
    trips,
    visibleTrips: trips,
  });
});

const card = (name: RegExp) => screen.getByRole('radio', { name });

describe('FiltersSheetBody', () => {
  it('shows each trip type with its count, with the applied type selected', async () => {
    await render(<FiltersSheetBody onSnapTo={onSnapTo} />);

    expect(card(/^All trips, 6 trips/)).toBeChecked();
    expect(card(/^Flight \+ Stay, 2 trips/)).not.toBeChecked();
    expect(card(/^Villa, 3 trips/)).not.toBeChecked();
    expect(card(/^Experience, 1 trip$/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Show 6 trips' })).toBeOnTheScreen();
  });

  // Only one type at a time, so "All" never sits selected beside another type.
  it('selects one type at a time without touching the feed', async () => {
    const user = userEvent.setup();
    await render(<FiltersSheetBody onSnapTo={onSnapTo} />);

    await user.press(card(/^Villa/));

    expect(card(/^Villa/)).toBeChecked();
    expect(card(/^All trips/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Show 3 trips' })).toBeOnTheScreen();
    expect(useTripsStore.getState().tripFilter).toBe('all');
  });

  it('applies the chosen type and closes the sheet on "Show N trips"', async () => {
    const user = userEvent.setup();
    await render(<FiltersSheetBody onSnapTo={onSnapTo} />);

    await user.press(card(/^Experience/));
    await user.press(screen.getByRole('button', { name: 'Show 1 trip' }));

    expect(useTripsStore.getState().tripFilter).toBe('experience');
    expect(useTripsStore.getState().visibleTrips).toEqual([trips[3]]);
    expect(onSnapTo).toHaveBeenCalledWith('closed');
  });

  it('resets the choice to all trips, leaving the applied type until "Show"', async () => {
    const user = userEvent.setup();
    useTripsStore.getState().applyTripFilter('villa');
    await render(<FiltersSheetBody onSnapTo={onSnapTo} />);
    expect(card(/^Villa/)).toBeChecked();

    await user.press(screen.getByRole('button', { name: 'Reset' }));

    expect(card(/^All trips/)).toBeChecked();
    expect(useTripsStore.getState().tripFilter).toBe('villa');
    expect(onSnapTo).not.toHaveBeenCalled();
  });

  it('closes from the close button without applying the choice', async () => {
    const user = userEvent.setup();
    await render(<FiltersSheetBody onSnapTo={onSnapTo} />);

    await user.press(card(/^Villa/));
    await user.press(screen.getByRole('button', { name: 'Close filters' }));

    expect(onSnapTo).toHaveBeenCalledWith('closed');
    expect(useTripsStore.getState().tripFilter).toBe('all');
  });

  // Loading or failed: counts are 0 and "Show" still applies, leaving the feed its own state.
  it('still applies with no trips loaded', async () => {
    const user = userEvent.setup();
    useTripsStore.setState(useTripsStore.getInitialState());
    await render(<FiltersSheetBody onSnapTo={onSnapTo} />);

    await user.press(card(/^Villa, 0 trips/));
    await user.press(screen.getByRole('button', { name: 'Show 0 trips' }));

    expect(useTripsStore.getState().tripFilter).toBe('villa');
    expect(onSnapTo).toHaveBeenCalledWith('closed');
  });
});
