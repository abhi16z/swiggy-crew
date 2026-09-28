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

// Adds `toHaveAnimatedStyle` / `toHaveAnimatedProps` and makes animations run on Jest timers.
jest
  .requireActual<typeof import('react-native-reanimated')>('react-native-reanimated')
  .setUpTests();
