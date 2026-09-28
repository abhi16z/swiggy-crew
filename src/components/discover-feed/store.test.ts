import { FETCH_TIMEOUT_MS, TRIPS_URL } from './constants';
import { useTripsStore } from './store';
import { jsonResponse, makeTrips } from './test-data';

const realFetch = globalThis.fetch;
const mockFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();

beforeEach(() => {
  globalThis.fetch = mockFetch as typeof fetch;
  useTripsStore.setState({ status: 'idle', trips: [] });
});

afterEach(() => {
  globalThis.fetch = realFetch;
  mockFetch.mockReset();
  jest.useRealTimers();
});

const loadTrips = () => useTripsStore.getState().loadTrips();

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
