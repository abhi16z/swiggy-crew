// Worklets is a native-only runtime; the mock runs worklets synchronously on the JS thread.
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));

// Real provider needs native window metrics; the mock returns zero insets and a 320x640 frame.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual<{ default: object }>('react-native-safe-area-context/jest/mock').default,
);

// Adds `toHaveAnimatedStyle` / `toHaveAnimatedProps` and makes animations run on Jest timers.
jest
  .requireActual<typeof import('react-native-reanimated')>('react-native-reanimated')
  .setUpTests();
