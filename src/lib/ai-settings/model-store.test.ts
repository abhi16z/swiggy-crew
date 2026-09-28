import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_MODEL_ID } from '@/lib/open-router';

import { getModelId, MODEL_STORAGE_KEY, setModelId, useModelStore } from './model-store';

afterEach(async () => {
  setModelId(DEFAULT_MODEL_ID);
  await AsyncStorage.clear();
});

describe('model store', () => {
  it('starts with the default model', () => {
    expect(getModelId()).toBe(DEFAULT_MODEL_ID);
  });

  it('brings the chosen model back after a relaunch', async () => {
    setModelId('google/gemma-4-26b-a4b-it:free');
    await Promise.resolve();
    expect(await AsyncStorage.getItem(MODEL_STORAGE_KEY)).toContain('gemma-4-26b');

    // A relaunch starts from the default, then reads the saved value back.
    useModelStore.setState({ modelId: DEFAULT_MODEL_ID }, false);
    await AsyncStorage.setItem(
      MODEL_STORAGE_KEY,
      JSON.stringify({ state: { modelId: 'google/gemma-4-26b-a4b-it:free' }, version: 0 }),
    );
    await useModelStore.persist.rehydrate();

    expect(getModelId()).toBe('google/gemma-4-26b-a4b-it:free');
  });
});
