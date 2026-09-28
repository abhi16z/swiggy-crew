import { render, screen, userEvent } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { useTripsStore } from '@/components/discover-feed/store';
import { makeTrips } from '@/components/discover-feed/test-data';

import { SHEET_HANDLE_HEIGHT } from './constants';
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

const renderBody = (fullHeight = false) =>
  render(<FiltersSheetBody onSnapTo={onSnapTo} fullHeight={fullHeight} />);
const radio = (name: RegExp) => screen.getByRole('radio', { name });
const sortHeader = () => screen.getByRole('button', { name: /^Sort by/ });

describe('FiltersSheetBody', () => {
  it('shows each trip type with its count, with the applied type selected', async () => {
    await renderBody();

    expect(radio(/^All trips, 6 trips/)).toBeChecked();
    expect(radio(/^Flight \+ Stay, 2 trips/)).not.toBeChecked();
    expect(radio(/^Villa, 3 trips/)).not.toBeChecked();
    expect(radio(/^Experience, 1 trip$/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Show 6 trips' })).toBeOnTheScreen();
  });

  // Only one type at a time, so "All" never sits selected beside another type.
  it('selects one type at a time without touching the feed', async () => {
    const user = userEvent.setup();
    await renderBody();

    await user.press(radio(/^Villa/));

    expect(radio(/^Villa/)).toBeChecked();
    expect(radio(/^All trips/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Show 3 trips' })).toBeOnTheScreen();
    expect(useTripsStore.getState().tripFilter).toBe('all');
  });

  it('keeps Sort by collapsed at first, showing the applied sort on its header', async () => {
    useTripsStore.getState().applyFilters({ tripFilter: 'all', tripSort: 'top_rated' });
    await renderBody();

    expect(sortHeader()).toBeCollapsed();
    expect(screen.getByRole('button', { name: 'Sort by, Top rated' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Recommended' })).not.toBeOnTheScreen();
  });

  it('applies the chosen type and sort together and closes the sheet on "Show"', async () => {
    const user = userEvent.setup();
    await renderBody();

    await user.press(radio(/^Villa/));
    await user.press(sortHeader());
    await user.press(radio(/^Price: low to high/));
    expect(screen.getByRole('button', { name: 'Sort by, Price: low to high' })).toBeOnTheScreen();
    expect(useTripsStore.getState().tripSort).toBe('recommended');

    await user.press(screen.getByRole('button', { name: 'Show 3 trips' }));

    expect(useTripsStore.getState()).toMatchObject({ tripFilter: 'villa', tripSort: 'price_low' });
    expect(onSnapTo).toHaveBeenCalledWith('closed');
  });

  it('resets both choices, leaving the applied ones until "Show"', async () => {
    const user = userEvent.setup();
    useTripsStore.getState().applyFilters({ tripFilter: 'villa', tripSort: 'top_rated' });
    await renderBody();

    await user.press(screen.getByRole('button', { name: 'Reset' }));

    expect(radio(/^All trips/)).toBeChecked();
    expect(screen.getByRole('button', { name: 'Sort by, Recommended' })).toBeOnTheScreen();
    expect(useTripsStore.getState()).toMatchObject({ tripFilter: 'villa', tripSort: 'top_rated' });
    expect(onSnapTo).not.toHaveBeenCalled();
  });

  it('closes from the close button without applying the choices', async () => {
    const user = userEvent.setup();
    await renderBody();

    await user.press(radio(/^Villa/));
    await user.press(screen.getByRole('button', { name: 'Close filters' }));

    expect(onSnapTo).toHaveBeenCalledWith('closed');
    expect(useTripsStore.getState().tripFilter).toBe('all');
  });

  // Loading or failed: counts are 0 and "Show" still applies, leaving the feed its own state.
  it('still applies with no trips loaded', async () => {
    const user = userEvent.setup();
    useTripsStore.setState(useTripsStore.getInitialState());
    await renderBody();

    await user.press(radio(/^Villa, 0 trips/));
    await user.press(screen.getByRole('button', { name: 'Show 0 trips' }));

    expect(useTripsStore.getState().tripFilter).toBe('villa');
    expect(onSnapTo).toHaveBeenCalledWith('closed');
  });

  // At half height the sheet's lower half is off screen; the body must fit in the upper part
  // so an expanded Sort by scrolls there and the buttons stay visible.
  it('fits the part of the sheet on screen at half height, and the whole sheet at full', async () => {
    // Test insets are zero, so the visible part is half the window.
    const visibleAtHalf = Dimensions.get('window').height / 2;
    await renderBody();
    expect(screen.root).toHaveStyle({ maxHeight: visibleAtHalf - SHEET_HANDLE_HEIGHT });

    await screen.rerender(<FiltersSheetBody onSnapTo={onSnapTo} fullHeight />);
    expect(screen.root).not.toHaveStyle({ maxHeight: visibleAtHalf - SHEET_HANDLE_HEIGHT });
  });
});
