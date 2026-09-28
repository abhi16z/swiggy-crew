import * as SecureStore from 'expo-secure-store';

import {
  API_KEY_STORAGE_KEY,
  getApiKey,
  loadApiKey,
  maskApiKey,
  removeApiKey,
  resetApiKeyStore,
  saveApiKey,
} from './api-key-store';

afterEach(async () => {
  await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
  resetApiKeyStore();
});

describe('api key store', () => {
  it('saves the key to secure storage, not AsyncStorage', async () => {
    await saveApiKey('sk-or-v1-abc');

    expect(await SecureStore.getItemAsync(API_KEY_STORAGE_KEY)).toBe('sk-or-v1-abc');
    expect(getApiKey()).toBe('sk-or-v1-abc');
  });

  it('restores a saved key on launch', async () => {
    await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, 'sk-or-v1-saved');

    expect(await loadApiKey()).toBe('sk-or-v1-saved');
    expect(getApiKey()).toBe('sk-or-v1-saved');
  });

  it('keeps a key saved while the launch read is still in flight', async () => {
    await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, 'sk-or-v1-old');

    const load = loadApiKey();
    await saveApiKey('sk-or-v1-new');

    expect(await load).toBe('sk-or-v1-new');
    expect(getApiKey()).toBe('sk-or-v1-new');
  });

  it('forgets the key when removed', async () => {
    await saveApiKey('sk-or-v1-abc');

    await removeApiKey();

    expect(getApiKey()).toBeNull();
    expect(await SecureStore.getItemAsync(API_KEY_STORAGE_KEY)).toBeNull();
  });
});

describe('maskApiKey', () => {
  it('shows only the prefix and the last four characters', () => {
    expect(maskApiKey('sk-or-v1-0123456789abcdef')).toBe('sk-or-v1-…cdef');
  });

  it('hides very short values completely', () => {
    expect(maskApiKey('short')).toBe('••••');
  });
});
