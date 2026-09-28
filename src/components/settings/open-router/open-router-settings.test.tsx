import { act, render, screen, userEvent } from '@testing-library/react-native';

import { getModelId, loadApiKey, saveApiKey, setModelId } from '@/lib/ai-settings';
import { resetApiKeyStore } from '@/lib/ai-settings/api-key-store';
import { DEFAULT_MODEL_ID, loadChatModels, OpenRouterError, verifyKey } from '@/lib/open-router';

import { OpenRouterSettings } from '.';

jest.mock('@/lib/open-router', () => ({
  ...jest.requireActual<typeof import('@/lib/open-router')>('@/lib/open-router'),
  verifyKey: jest.fn(),
  loadChatModels: jest.fn(),
}));

const MODELS = [
  {
    id: 'anthropic/claude-opus-5',
    name: 'Anthropic: Claude Opus 5',
    contextLength: 1_000_000,
    promptPrice: 0.000005,
    completionPrice: 0.000025,
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B (free)',
    contextLength: 131_072,
    promptPrice: 0,
    completionPrice: 0,
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
    await user.press(screen.getByText('Google: Gemma 4 26B (free)'));

    expect(getModelId()).toBe('google/gemma-4-26b-a4b-it:free');
    expect(screen.queryByLabelText('Search models')).not.toBeOnTheScreen();
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
