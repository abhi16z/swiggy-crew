import { render } from '@testing-library/react-native';
import { SplashScreen } from 'expo-router';
import { Text } from 'react-native';

import { useHideSplashScreen } from '.';

jest.mock('expo-router', () => ({
  SplashScreen: { preventAutoHideAsync: jest.fn(async () => {}), hide: jest.fn() },
}));

const splash = jest.mocked(SplashScreen);

// A stand-in root layout. It records how many times the splash had been hidden each time it
// rendered.
const hideCallsWhileRendering: number[] = [];
function Root({ ready }: { ready?: boolean }) {
  useHideSplashScreen(ready);
  hideCallsWhileRendering.push(splash.hide.mock.calls.length);
  return <Text>Home</Text>;
}

// Regression: on Android the splash hid while the first screen was still rendering, so a
// white screen showed for about two seconds before the app appeared.
describe('splash screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is held up as soon as the root layout starts loading', async () => {
    await import('./keep-splash-visible');

    expect(splash.preventAutoHideAsync).toHaveBeenCalledTimes(1);
    expect(splash.hide).not.toHaveBeenCalled();
  });

  it('hides only once the first tree has mounted', async () => {
    hideCallsWhileRendering.length = 0;
    const { rerender } = await render(<Root />);
    // Rendering alone must not hide it; mounting the tree does.
    expect(hideCallsWhileRendering[0]).toBe(0);
    expect(splash.hide).toHaveBeenCalledTimes(1);

    await rerender(<Root />);
    expect(splash.hide).toHaveBeenCalledTimes(1);
  });

  // The root layout waits for the saved onboarding state, so a first launch goes from the
  // splash straight to onboarding, never through a flash of Home.
  it('stays up until the app says it is ready', async () => {
    const { rerender } = await render(<Root ready={false} />);
    expect(splash.hide).not.toHaveBeenCalled();

    await rerender(<Root ready />);
    expect(splash.hide).toHaveBeenCalledTimes(1);
  });
});
