// Worklets is a native-only runtime; the mock runs worklets synchronously on the JS thread.
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));

// Real provider needs native window metrics; the mock returns zero insets and a 320x640 frame.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);

// Native storage module is unavailable in Jest; the mock keeps values in memory.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Keychain/Keystore are native-only; the mock keeps values in memory.
jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
});

// The library's own mock: plain views and zero keyboard height.
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);

// FlashList measures native views before it renders items, and Jest has none. This gives the
// list the safe-area mock's 320x640 frame and every item a card's height, so the list builds
// only what would be near the screen on a phone. (The library's own jestSetup is broken in
// 2.0.2: it swaps in a `RecyclerView` export that no longer exists.)
jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () => ({
  ...jest.requireActual<object>('@shopify/flash-list/dist/recyclerview/utils/measureLayout'),
  measureParentSize: () => ({ x: 0, y: 0, width: 320, height: 640 }),
  measureFirstChildLayout: () => ({ x: 0, y: 0, width: 320, height: 640 }),
  measureItemLayout: () => ({ x: 0, y: 0, width: 320, height: 380 }),
}));

// Adds `toHaveAnimatedStyle` / `toHaveAnimatedProps` and makes animations run on Jest timers.
jest
  .requireActual<typeof import('react-native-reanimated')>('react-native-reanimated')
  .setUpTests();
