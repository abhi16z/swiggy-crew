import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export const API_KEY_STORAGE_KEY = 'open-router-api-key';

// SecureStore has no web implementation; on web the key lives in memory for the session only.
const persistent = process.env.EXPO_OS !== 'web';

type ApiKeyState = {
  loaded: boolean;
  apiKey: string | null;
};

const useApiKeyStore = create<ApiKeyState>()(() => ({ loaded: !persistent, apiKey: null }));

let loading: Promise<string | null> | null = null;

/** Reads the saved key from the Keychain/Keystore once; later calls reuse the result. */
export function loadApiKey() {
  if (!persistent) return Promise.resolve(useApiKeyStore.getState().apiKey);
  loading ??= SecureStore.getItemAsync(API_KEY_STORAGE_KEY)
    .catch(() => null)
    .then((apiKey) => {
      // A key saved while the read was in flight wins over the older stored value.
      const current = useApiKeyStore.getState();
      const next = current.loaded ? current.apiKey : apiKey;
      useApiKeyStore.setState({ loaded: true, apiKey: next });
      return next;
    });
  return loading;
}

export async function saveApiKey(apiKey: string) {
  if (persistent) await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey);
  useApiKeyStore.setState({ loaded: true, apiKey });
}

export async function removeApiKey() {
  if (persistent) await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
  useApiKeyStore.setState({ loaded: true, apiKey: null });
}

export function getApiKey() {
  return useApiKeyStore.getState().apiKey;
}

export function useApiKey() {
  return useApiKeyStore((state) => state.apiKey);
}

export function useApiKeyLoaded() {
  return useApiKeyStore((state) => state.loaded);
}

/** Test helper: forget the stored key, the in-memory key, and the cached read. */
export async function resetApiKeyStore() {
  if (persistent) await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY).catch(() => null);
  loading = null;
  useApiKeyStore.setState({ loaded: !persistent, apiKey: null });
}

/** Shows enough of a key to recognise it: `sk-or-v1-…9f3a`. */
export function maskApiKey(apiKey: string) {
  if (apiKey.length <= 12) return '••••';
  return `${apiKey.slice(0, 9)}…${apiKey.slice(-4)}`;
}
