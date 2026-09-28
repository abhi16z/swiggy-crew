import { FETCH_TIMEOUT_MS } from '@/components/discover-feed/constants';
import { useTripsStore } from '@/components/discover-feed/store';
import { jsonResponse, makeTrips } from '@/components/discover-feed/test-data';

import { DESTINATIONS_WAIT_MS } from './constants';
import { loadDestinations, resetDestinationsCache, toDestinationList } from './destinations';
import { buildSystemPrompt, composeSystemPrompt } from './system-prompt';

const realFetch = globalThis.fetch;
const mockFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();

const [serengeti, bodhGaya, serengetiAgain, blank] = makeTrips(4);
const TRIPS = [
  { ...serengeti, destination: 'Serengeti', country: 'Tanzania' },
  { ...bodhGaya, destination: 'Bodh Gaya', country: 'India' },
  { ...serengetiAgain, destination: ' Serengeti ', country: 'Tanzania' },
  { ...blank, destination: '  ' },
];

beforeEach(() => {
  globalThis.fetch = mockFetch as typeof fetch;
  useTripsStore.setState(useTripsStore.getInitialState());
  resetDestinationsCache();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  mockFetch.mockReset();
});

describe('toDestinationList', () => {
  it('lists each destination once with its country, in feed order, skipping blank names', () => {
    expect(toDestinationList(TRIPS)).toEqual(['Serengeti (Tanzania)', 'Bodh Gaya (India)']);
  });
});

describe('composeSystemPrompt', () => {
  it('names the destinations the app offers', () => {
    const prompt = composeSystemPrompt(['Serengeti (Tanzania)', 'Bodh Gaya (India)']);

    expect(prompt).toContain(
      'Destinations currently offered in the app: Serengeti (Tanzania), Bodh Gaya (India).',
    );
  });

  it('still works without a destination list', () => {
    expect(composeSystemPrompt([])).not.toContain('Destinations currently offered');
  });
});

describe('loadDestinations', () => {
  it('reuses the trips the feed already loaded, without downloading them again', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(TRIPS));
    await useTripsStore.getState().loadTrips();

    expect(await loadDestinations()).toEqual(['Serengeti (Tanzania)', 'Bodh Gaya (India)']);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('shares the feed request that is still in flight', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(TRIPS));

    const [, destinations] = await Promise.all([
      useTripsStore.getState().loadTrips(),
      loadDestinations(),
    ]);

    expect(destinations).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to an empty list and retries later when the download fails', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    mockFetch.mockResolvedValueOnce(jsonResponse(TRIPS));

    expect(await loadDestinations()).toEqual([]);
    expect(await loadDestinations()).toHaveLength(2);
  });
});

describe('buildSystemPrompt', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not hold up the first message when the feed is slow', async () => {
    jest.useFakeTimers();
    // Settles only through the feed's own timeout, so the prompt must not wait for it.
    mockFetch.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );

    const prompt = buildSystemPrompt();
    await jest.advanceTimersByTimeAsync(DESTINATIONS_WAIT_MS);

    expect(await prompt).not.toContain('Destinations currently offered');
    // Let the feed request time out, so no load is left in flight for later tests.
    await jest.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS);
  });
});
