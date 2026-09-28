import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PERFORMANCE_PANEL_STORAGE_KEY,
  setPerformancePanelVisible,
  usePerformancePanelStore,
} from './store';

async function storedVisible() {
  const raw = await AsyncStorage.getItem(PERFORMANCE_PANEL_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw).state.visible;
}

afterEach(async () => {
  setPerformancePanelVisible(false);
  await AsyncStorage.clear();
});

describe('performance panel store', () => {
  it('persists the visibility when it changes', async () => {
    setPerformancePanelVisible(true);
    expect(await storedVisible()).toBe(true);

    setPerformancePanelVisible(false);
    expect(await storedVisible()).toBe(false);
  });

  it('restores a saved visibility on launch', async () => {
    await AsyncStorage.setItem(
      PERFORMANCE_PANEL_STORAGE_KEY,
      JSON.stringify({ state: { visible: true }, version: 0 }),
    );

    await usePerformancePanelStore.persist.rehydrate();

    expect(usePerformancePanelStore.getState().visible).toBe(true);
  });
});
