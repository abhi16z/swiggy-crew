import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type OnboardingState = {
  completed: boolean;
  complete: () => void;
  replay: () => void;
};

export const ONBOARDING_STORAGE_KEY = 'onboarding';

// Whether the saved `completed` has been read back, kept outside the store: setting store state
// while hydrating would write it straight back to storage (and crash web's server render,
// which has no storage). zustand's own `hasHydrated()` stays false after a failed read, which
// would hold the splash forever.
let hydrated = false;
const hydratedListeners = new Set<() => void>();

function markHydrated() {
  hydrated = true;
  hydratedListeners.forEach((listener) => listener());
}

function subscribeHydrated(listener: () => void) {
  hydratedListeners.add(listener);
  return () => {
    hydratedListeners.delete(listener);
  };
}

// Shown once on first launch; Skip and Get started both complete it. Settings can replay it.
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      complete: () => set({ completed: true }),
      replay: () => set({ completed: false }),
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ completed }) => ({ completed }),
      // Called after a successful and a failed read alike; a failed read shows onboarding.
      onRehydrateStorage: () => markHydrated,
    },
  ),
);

/** The saved state has been read, so it is known whether onboarding shows. */
export function useOnboardingHydrated() {
  return useSyncExternalStore(
    subscribeHydrated,
    () => hydrated,
    () => false,
  );
}

export function replayOnboarding() {
  useOnboardingStore.getState().replay();
}
