import { act, render, screen, userEvent, within } from '@testing-library/react-native';

import { DiscoverFeed } from '.';
import { FEED_BATCH_SIZE, SKELETON_COUNT } from './constants';
import { useTripsStore } from './store';
import { jsonResponse, makeTrips } from './test-data';

const realFetch = globalThis.fetch;
const mockFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();

beforeEach(() => {
  globalThis.fetch = mockFetch as typeof fetch;
  useTripsStore.setState(useTripsStore.getInitialState());
});

afterEach(() => {
  globalThis.fetch = realFetch;
  mockFetch.mockReset();
});

describe('DiscoverFeed', () => {
  it('shows the header and skeleton cards while the trips load', async () => {
    let respond: (response: Response) => void = () => {};
    mockFetch.mockReturnValueOnce(new Promise((resolve) => (respond = resolve)));

    await render(<DiscoverFeed />);

    expect(screen.getByRole('header', { name: 'Discover' })).toBeOnTheScreen();
    expect(screen.getByText('Loading')).toBeOnTheScreen();
    // Skeletons are hidden from screen readers; the Loading label speaks for them.
    expect(
      screen.getAllByTestId('trip-card-skeleton', { includeHiddenElements: true }),
    ).toHaveLength(SKELETON_COUNT);

    // Finish the request so its timeout timer doesn't outlive the test.
    respond(jsonResponse([]));
    await screen.findByText('No trips to show right now.');
  });

  // Regression: on iOS the header was drawn under the status bar clock.
  it('keeps the feed below the status bar', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(1)));

    await render(<DiscoverFeed />);

    expect(screen.root).toHaveProp(
      'edges',
      expect.objectContaining({ top: 'additive', bottom: 'off' }),
    );
    expect(await within(screen.root!).findByText('Trip 1')).toBeOnTheScreen();
  });

  it('shows the trips and their count once loaded', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(3)));

    await render(<DiscoverFeed />);

    expect(await screen.findByText('Trip 1')).toBeOnTheScreen();
    expect(screen.getByText('Trip 3')).toBeOnTheScreen();
    expect(screen.getByText('3 trips')).toBeOnTheScreen();
    expect(screen.queryByText('Loading')).not.toBeOnTheScreen();
    expect(
      screen.queryByTestId('trip-card-skeleton', { includeHiddenElements: true }),
    ).not.toBeOnTheScreen();
  });

  // Cards are heavy; mounting all of a long feed at once would stall a low-end phone.
  it('renders only the first batch of a long feed up front', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(120)));

    await render(<DiscoverFeed />);

    expect(await screen.findByText('120 trips')).toBeOnTheScreen();
    expect(screen.getByText(`Trip ${FEED_BATCH_SIZE}`)).toBeOnTheScreen();
    expect(screen.queryByText('Trip 120')).not.toBeOnTheScreen();
  });

  it('offers a retry when loading fails, and loads the trips on retry', async () => {
    const user = userEvent.setup();
    mockFetch
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(jsonResponse(makeTrips(2)));

    await render(<DiscoverFeed />);
    await user.press(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Trip 2')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeOnTheScreen();
  });

  it('says so when the feed has no trips', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));

    await render(<DiscoverFeed />);

    expect(await screen.findByText('No trips to show right now.')).toBeOnTheScreen();
  });

  // Regression: applying filters froze the feed. Given new data, a kept list rebuilds every
  // card it had built in one blocking pass; a new list builds only the first batch.
  it('starts a new list with only the applied trip type when filters are applied', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(4, ['villa', 'experience'])));
    await render(<DiscoverFeed />);
    const loadingList = screen.getByTestId('trip-feed');
    await screen.findByText('4 trips');
    // Loading the trips keeps the list; only applied filters replace it.
    expect(screen.getByTestId('trip-feed')).toBe(loadingList);

    await act(async () =>
      useTripsStore.getState().applyFilters({ tripFilter: 'villa', tripSort: 'recommended' }),
    );

    expect(screen.getByTestId('trip-feed')).not.toBe(loadingList);
    expect(screen.getByText('Trip 1')).toBeOnTheScreen();
    expect(screen.getByText('Trip 3')).toBeOnTheScreen();
    expect(screen.queryByText('Trip 2')).not.toBeOnTheScreen();
    expect(screen.getByText('2 trips')).toBeOnTheScreen();
  });

  it('starts a new list when only the sort changes', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(2)));
    await render(<DiscoverFeed />);
    await screen.findByText('2 trips');
    const list = screen.getByTestId('trip-feed');

    await act(async () =>
      useTripsStore.getState().applyFilters({ tripFilter: 'all', tripSort: 'top_rated' }),
    );

    expect(screen.getByTestId('trip-feed')).not.toBe(list);
  });

  // If the screen is ever remounted (e.g. a tab switch), the stored trips show without a refetch.
  it('reuses the loaded trips when mounted again', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(2)));
    await render(<DiscoverFeed />);
    await screen.findByText('Trip 1');

    await screen.unmount();
    await render(<DiscoverFeed />);

    expect(screen.getByText('Trip 1')).toBeOnTheScreen();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
