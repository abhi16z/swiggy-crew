import { act, render, screen, userEvent } from '@testing-library/react-native';

import { loadApiKey, resetApiKeyStore, saveApiKey } from '@/lib/ai-settings/api-key-store';
import { getModelId, setModelId } from '@/lib/ai-settings/model-store';
import { DEFAULT_MODEL_ID } from '@/lib/open-router/constants';
import { OpenRouterError } from '@/lib/open-router/errors';
import { loadChatModels } from '@/lib/open-router/models';
import { verifyKey } from '@/lib/open-router/verify-key';

import { OpenRouterSettings } from './open-router';

jest.mock('@/lib/open-router/verify-key', () => ({
  ...jest.requireActual<typeof import('@/lib/open-router/verify-key')>(
    '@/lib/open-router/verify-key',
  ),
  verifyKey: jest.fn(),
}));

jest.mock('@/lib/open-router/models', () => ({
  ...jest.requireActual<typeof import('@/lib/open-router/models')>('@/lib/open-router/models'),
  loadChatModels: jest.fn(),
}));

const MODELS = [
  {
    id: 'anthropic/claude-opus-5',
    name: 'Anthropic: Claude Opus 5',
    contextLength: 1_000_000,
    promptPrice: 0.000005,
    completionPrice: 0.000025,
    searchKey: 'anthropic: claude opus 5\nanthropic/claude-opus-5',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B (free)',
    contextLength: 131_072,
    promptPrice: 0,
    completionPrice: 0,
    searchKey: 'google: gemma 4 26b (free)\ngoogle/gemma-4-26b-a4b-it:free',
  },
];

async function renderSettings() {
  await render(<OpenRouterSettings />);
  await act(async () => {
    await loadApiKey();
  });
}

beforeEach(() => {
  jest.mocked(verifyKey).mockReset();
  jest.mocked(loadChatModels).mockResolvedValue(MODELS);
});

afterEach(async () => {
  await resetApiKeyStore();
  setModelId(DEFAULT_MODEL_ID);
});

describe('OpenRouterSettings', () => {
  it('asks for a key and hides the model setting until one is saved', async () => {
    await renderSettings();

    expect(screen.getByLabelText('OpenRouter key')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Change model' })).not.toBeOnTheScreen();
  });

  it('checks a key with OpenRouter before saving it, then shows it masked', async () => {
    const user = userEvent.setup();
    jest.mocked(verifyKey).mockResolvedValue(undefined);
    await renderSettings();

    await user.type(screen.getByLabelText('OpenRouter key'), 'sk-or-v1-0123456789abcdef');
    await user.press(screen.getByRole('button', { name: 'Save OpenRouter key' }));

    expect(verifyKey).toHaveBeenCalledWith('sk-or-v1-0123456789abcdef');
    expect(await screen.findByText('sk-or-v1-…cdef')).toBeOnTheScreen();
    expect(screen.getByText(DEFAULT_MODEL_ID)).toBeOnTheScreen();
  });

  it('keeps a rejected key out of storage and says why', async () => {
    const user = userEvent.setup();
    jest.mocked(verifyKey).mockRejectedValue(new OpenRouterError('auth', 'User not found.', 401));
    await renderSettings();

    await user.type(screen.getByLabelText('OpenRouter key'), 'sk-or-v1-wrong-key-value');
    await user.press(screen.getByRole('button', { name: 'Save OpenRouter key' }));

    expect(await screen.findByText('OpenRouter did not accept this key.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Change model' })).not.toBeOnTheScreen();
  });

  it('picks a model from the searchable list', async () => {
    const user = userEvent.setup();
    await act(async () => saveApiKey('sk-or-v1-0123456789abcdef'));
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Change model' }));
    await user.type(await screen.findByLabelText('Search models'), 'gemma');

    expect(screen.queryByText('Anthropic: Claude Opus 5')).not.toBeOnTheScreen();
    await user.press(screen.getByRole('radio', { name: /Google: Gemma 4 26B \(free\)/ }));

    expect(getModelId()).toBe('google/gemma-4-26b-a4b-it:free');
    expect(screen.queryByLabelText('Search models')).not.toBeOnTheScreen();
  });

  it('marks the chosen model as the checked option', async () => {
    const user = userEvent.setup();
    setModelId('anthropic/claude-opus-5');
    await act(async () => saveApiKey('sk-or-v1-0123456789abcdef'));
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Change model' }));

    expect(await screen.findByRole('radio', { name: /Claude Opus 5/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Gemma/ })).not.toBeChecked();
  });

  it('shows why the model list failed to load and loads it again on Retry', async () => {
    const user = userEvent.setup();
    jest.mocked(loadChatModels).mockClear();
    jest
      .mocked(loadChatModels)
      .mockRejectedValueOnce(new OpenRouterError('network', 'Network request failed'));
    await act(async () => saveApiKey('sk-or-v1-0123456789abcdef'));
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Change model' }));
    await user.press(await screen.findByRole('button', { name: 'Retry loading models' }));

    expect(await screen.findByText('Anthropic: Claude Opus 5')).toBeOnTheScreen();
    expect(loadChatModels).toHaveBeenCalledTimes(2);
  });

  it('removes the saved key', async () => {
    const user = userEvent.setup();
    await act(async () => saveApiKey('sk-or-v1-0123456789abcdef'));
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Remove OpenRouter key' }));

    expect(await screen.findByLabelText('OpenRouter key')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Change model' })).not.toBeOnTheScreen();
  });
});
