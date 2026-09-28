import { fetch } from 'expo/fetch';

import { DESTINATIONS_WAIT_MS } from './constants';
import { loadDestinations, resetDestinationsCache, toDestinationList } from './destinations';
import { buildSystemPrompt, composeSystemPrompt } from './system-prompt';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const mockFetch = jest.mocked(fetch);

const BUNDLES = [
  { id: 'serengeti-1', destination: 'Serengeti', country: 'Tanzania' },
  { id: 'bodh-gaya-2', destination: 'Bodh Gaya', country: 'India' },
  { id: 'serengeti-9', destination: 'Serengeti', country: 'Tanzania' },
  { id: 'broken', destination: 42 },
];

function bundlesResponse() {
  return { ok: true, status: 200, json: async () => BUNDLES } as never;
}

beforeEach(() => {
  mockFetch.mockReset();
  resetDestinationsCache();
});

describe('toDestinationList', () => {
  it('lists each destination once with its country, in feed order, skipping bad rows', () => {
    expect(toDestinationList(BUNDLES)).toEqual(['Serengeti (Tanzania)', 'Bodh Gaya (India)']);
  });

  it('returns nothing for a payload that is not a list', () => {
    expect(toDestinationList({ items: BUNDLES })).toEqual([]);
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
  it('downloads the feed once per session', async () => {
    mockFetch.mockResolvedValue(bundlesResponse());

    await loadDestinations();
    await loadDestinations();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to an empty list and retries later when the download fails', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    mockFetch.mockResolvedValueOnce(bundlesResponse());

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
    mockFetch.mockReturnValue(new Promise<never>(() => {}));

    const prompt = buildSystemPrompt();
    await jest.advanceTimersByTimeAsync(DESTINATIONS_WAIT_MS);

    expect(await prompt).not.toContain('Destinations currently offered');
  });
});
