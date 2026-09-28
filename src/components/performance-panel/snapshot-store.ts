import { create } from 'zustand';

import type { PerfSnapshot } from './types';

type SnapshotState = {
  snapshot: PerfSnapshot | null;
  publish: (snapshot: PerfSnapshot) => void;
  clear: () => void;
};

// Only the expanded panel subscribes, so a redraw re-renders nothing else in the app.
export const useSnapshotStore = create<SnapshotState>()((set) => ({
  snapshot: null,
  publish: (snapshot) => set({ snapshot }),
  clear: () => set({ snapshot: null }),
}));

export function publishSnapshot(snapshot: PerfSnapshot) {
  useSnapshotStore.getState().publish(snapshot);
}

export function clearSnapshot() {
  useSnapshotStore.getState().clear();
}

export function useSnapshot() {
  return useSnapshotStore((state) => state.snapshot);
}
