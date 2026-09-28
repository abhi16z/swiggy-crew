import { fetch } from 'expo/fetch';

import {
  formatPrice,
  loadChatModels,
  matchesQuery,
  resetChatModelsCache,
  toChatModels,
} from './models';
import type { RawOpenRouterModel } from './types';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const mockFetch = jest.mocked(fetch);

const text = { input_modalities: ['text'], output_modalities: ['text'] };

const RAW: RawOpenRouterModel[] = [
  {
    id: 'anthropic/claude-opus-5',
    name: 'Anthropic: Claude Opus 5',
    context_length: 1_000_000,
    pricing: { prompt: '0.000005', completion: '0.000025' },
    architecture: text,
  },
  { id: 'anthropic/claude-opus-5:batch', name: 'Opus batch', architecture: text },
  {
    id: 'acme/image-maker',
    name: 'Acme Image',
    architecture: { input_modalities: ['text'], output_modalities: ['image'] },
  },
  {
    id: 'acme/tiny:free',
    name: 'Acme Tiny',
    pricing: { prompt: '0', completion: '0' },
    architecture: text,
  },
];

beforeEach(() => {
  mockFetch.mockReset();
  resetChatModelsCache();
});

describe('toChatModels', () => {
  it('keeps text chat models, drops batch-only and non-text ones, and sorts by name', () => {
    expect(toChatModels(RAW).map((model) => model.id)).toEqual([
      'acme/tiny:free',
      'anthropic/claude-opus-5',
    ]);
  });

  it('reads prices per token and tolerates missing fields', () => {
    const [model] = toChatModels([{ id: 'x/y' }]);

    expect(model).toEqual({
      id: 'x/y',
      name: 'x/y',
      contextLength: null,
      promptPrice: 0,
      completionPrice: 0,
    });
  });
});

describe('formatPrice', () => {
  it('shows input and output prices per million tokens', () => {
    expect(formatPrice({ promptPrice: 0.000005, completionPrice: 0.000025 })).toBe(
      '$5.00 / $25.00 per 1M tokens',
    );
  });

  it('labels free models and routers whose price varies', () => {
    expect(formatPrice({ promptPrice: 0, completionPrice: 0 })).toBe('Free');
    expect(formatPrice({ promptPrice: -1, completionPrice: -1 })).toBe('Variable price');
  });
});

describe('matchesQuery', () => {
  const [model] = toChatModels([RAW[0]]);

  it('matches the id or display name, ignoring case and surrounding spaces', () => {
    expect(matchesQuery(model, '  OPUS ')).toBe(true);
    expect(matchesQuery(model, 'anthropic/')).toBe(true);
    expect(matchesQuery(model, 'gemini')).toBe(false);
    expect(matchesQuery(model, '')).toBe(true);
  });
});

describe('loadChatModels', () => {
  const ok = { ok: true, status: 200, json: async () => ({ data: RAW }) } as never;

  it('downloads the catalog once and reuses it', async () => {
    mockFetch.mockResolvedValue(ok);

    const first = await loadChatModels();
    const second = await loadChatModels();

    expect(first).toBe(second);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on the next call after a failed download', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    mockFetch.mockResolvedValueOnce(ok);

    await expect(loadChatModels()).rejects.toThrow('Network request failed');
    await expect(loadChatModels()).resolves.toHaveLength(2);
  });
});
