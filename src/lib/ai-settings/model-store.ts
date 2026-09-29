import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_MODEL_ID } from '@/lib/open-router/constants';

type ModelState = {
  modelId: string;
};

export const MODEL_STORAGE_KEY = 'ask-crew-model';

// The model id is not secret, so it is saved with AsyncStorage like other preferences.
export const useModelStore = create<ModelState>()(
  persist(() => ({ modelId: DEFAULT_MODEL_ID }), {
    name: MODEL_STORAGE_KEY,
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

export function setModelId(modelId: string) {
  useModelStore.setState({ modelId });
}

export function getModelId() {
  return useModelStore.getState().modelId;
}

export function useModelId() {
  return useModelStore((state) => state.modelId);
}
