import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PerformancePanelState = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

export const PERFORMANCE_PANEL_STORAGE_KEY = 'performance-panel';

// Hidden until the persisted value is read back from storage on launch.
export const usePerformancePanelStore = create<PerformancePanelState>()(
  persist(
    (set) => ({
      visible: false,
      setVisible: (visible) => set({ visible }),
    }),
    {
      name: PERFORMANCE_PANEL_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ visible }) => ({ visible }),
    },
  ),
);

export function setPerformancePanelVisible(visible: boolean) {
  usePerformancePanelStore.getState().setVisible(visible);
}

export function usePerformancePanelVisible() {
  return usePerformancePanelStore((state) => state.visible);
}
