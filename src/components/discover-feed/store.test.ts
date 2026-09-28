import { FETCH_TIMEOUT_MS, TRIPS_URL } from './constants';
import { useTripsStore, type AppliedFilters } from './store';
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
  jest.useRealTimers();
});

const loadTrips = () => useTripsStore.getState().loadTrips();
const applyFilters = (filters: AppliedFilters) => useTripsStore.getState().applyFilters(filters);

describe('trips store', () => {
  it('fetches the trips and stores them', async () => {
    const trips = makeTrips(3);
    mockFetch.mockResolvedValueOnce(jsonResponse(trips));

    await loadTrips();

    expect(mockFetch).toHaveBeenCalledWith(TRIPS_URL, expect.anything());
    expect(useTripsStore.getState()).toMatchObject({ status: 'success', trips });
  });

  it('is loading while the request is in flight', async () => {
    let respond: (response: Response) => void = () => {};
    mockFetch.mockReturnValueOnce(new Promise((resolve) => (respond = resolve)));

    const loading = loadTrips();

    expect(useTripsStore.getState().status).toBe('loading');
    respond(jsonResponse([]));
    await loading;
  });

  // The data is static: a second mount or a double call must not download 261 trips again.
  it('does not fetch again while loading or once loaded', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(1)));

    await Promise.all([loadTrips(), loadTrips()]);
    await loadTrips();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['the network fails', () => Promise.reject(new TypeError('Network request failed'))],
    ['the server answers with an error', () => Promise.resolve(jsonResponse('Not found', 404))],
  ])('ends in the error state when %s', async (_case, respond) => {
    mockFetch.mockImplementationOnce(respond);

    await loadTrips();

    expect(useTripsStore.getState()).toMatchObject({ status: 'error', trips: [] });
  });

  it('can load again after an error', async () => {
    const trips = makeTrips(2);
    mockFetch
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(jsonResponse(trips));

    await loadTrips();
    await loadTrips();

    expect(useTripsStore.getState()).toMatchObject({ status: 'success', trips });
  });

  it('shows every trip until a trip type is applied', async () => {
    const trips = makeTrips(2, ['villa', 'experience']);
    mockFetch.mockResolvedValueOnce(jsonResponse(trips));

    await loadTrips();

    expect(useTripsStore.getState()).toMatchObject({
      tripFilter: 'all',
      tripSort: 'recommended',
      visibleTrips: trips,
    });
  });

  it('keeps only the trips of the applied type, and all of them again for "all"', async () => {
    const trips = makeTrips(4, ['villa', 'experience']);
    mockFetch.mockResolvedValueOnce(jsonResponse(trips));
    await loadTrips();

    applyFilters({ tripFilter: 'villa', tripSort: 'recommended' });
    expect(useTripsStore.getState().visibleTrips).toEqual([trips[0], trips[2]]);

    applyFilters({ tripFilter: 'all', tripSort: 'recommended' });
    expect(useTripsStore.getState().visibleTrips).toEqual(trips);
  });

  // Recommended is the data order, so undoing a sort must bring that order back.
  it('sorts the visible trips, and restores data order for recommended', async () => {
    const trips = makeTrips(3).map((trip, index) => ({ ...trip, rating: [4.1, 4.9, 4.5][index] }));
    mockFetch.mockResolvedValueOnce(jsonResponse(trips));
    await loadTrips();

    applyFilters({ tripFilter: 'all', tripSort: 'top_rated' });
    expect(useTripsStore.getState().visibleTrips).toEqual([trips[1], trips[2], trips[0]]);

    applyFilters({ tripFilter: 'all', tripSort: 'recommended' });
    expect(useTripsStore.getState().visibleTrips).toEqual(trips);
  });

  // Filters are applied without a refetch, and a load that finishes later still respects them.
  it('applies the chosen type and sort to trips that finish loading after them', async () => {
    const trips = makeTrips(3, ['flight_stay', 'villa']).map((trip, index) => ({
      ...trip,
      price: { ...trip.price, amount: [30000, 10000, 20000][index] },
    }));
    mockFetch.mockResolvedValueOnce(jsonResponse(trips));

    applyFilters({ tripFilter: 'flight_stay', tripSort: 'price_low' });
    await loadTrips();

    expect(useTripsStore.getState().visibleTrips).toEqual([trips[2], trips[0]]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // A new visibleTrips array re-renders the feed; re-applying the same filters must not.
  it('keeps the visible trips as they are when the applied filters did not change', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(3, ['villa', 'experience'])));
    await loadTrips();
    applyFilters({ tripFilter: 'villa', tripSort: 'top_rated' });
    const visible = useTripsStore.getState().visibleTrips;

    applyFilters({ tripFilter: 'villa', tripSort: 'top_rated' });

    expect(useTripsStore.getState().visibleTrips).toBe(visible);
  });

  it('shows no trips for a type the feed does not have', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(makeTrips(2, ['villa'])));
    await loadTrips();

    applyFilters({ tripFilter: 'experience', tripSort: 'recommended' });

    expect(useTripsStore.getState().visibleTrips).toEqual([]);
  });

  // A request that never answers on a weak network must not leave the feed loading forever.
  it('gives up with an error when the request takes too long', async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );

    const loading = loadTrips();
    jest.advanceTimersByTime(FETCH_TIMEOUT_MS);
    await loading;

    expect(useTripsStore.getState().status).toBe('error');
  });
});
