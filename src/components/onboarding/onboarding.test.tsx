import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SplashScreen } from 'expo-router';
import { BackHandler } from 'react-native';

import { useHideSplashScreen } from '@/lib/splash';

import { OnboardingGate } from '.';
import { SLIDES } from './slides';
import { ONBOARDING_STORAGE_KEY, useOnboardingHydrated, useOnboardingStore } from './store';

jest.mock('expo-router', () => ({
  SplashScreen: { preventAutoHideAsync: jest.fn(async () => {}), hide: jest.fn() },
}));

// The root layout's splash handling, with only the onboarding under it.
function RootLayout() {
  useHideSplashScreen(useOnboardingHydrated());
  return <OnboardingGate />;
}

async function storedCompleted() {
  const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw).state.completed;
}

// The Android back handler the onboarding registered last.
let pressBack: () => boolean | null | undefined = () => false;
const addBackListener = BackHandler.addEventListener;
beforeEach(() => {
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
    pressBack = () => handler({ type: 'hardwareBackPress', timeStamp: Date.now() });
    return addBackListener(event, handler);
  });
});

afterEach(async () => {
  jest.restoreAllMocks();
  await act(async () => useOnboardingStore.setState({ completed: false }));
  await AsyncStorage.clear();
});

async function renderFirstLaunch() {
  await useOnboardingStore.persist.rehydrate();
  await render(<OnboardingGate />);
  return screen.findByRole('header', { name: SLIDES[0].title });
}

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

describe('Onboarding', () => {
  it('shows on first launch, starting at the first page', async () => {
    expect(await renderFirstLaunch()).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Skip onboarding' })).toBeOnTheScreen();
  });

  // Regression: onboarding was lazy-loaded, so the splash hid before its code arrived and a
  // white screen showed meanwhile (for seconds in dev, where Metro serves the chunk).
  it('is on screen by the time the splash hides, with no blank screen between', async () => {
    await useOnboardingStore.persist.rehydrate();
    let onboardingMountedAtHide: boolean | undefined;
    jest.mocked(SplashScreen.hide).mockImplementationOnce(() => {
      // Onboarding registers its back handler when it mounts.
      onboardingMountedAtHide = jest.mocked(BackHandler.addEventListener).mock.calls.length > 0;
    });

    await render(<RootLayout />);

    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
    expect(onboardingMountedAtHide).toBe(true);
  });

  it('walks through every page and finishes for good with Get started', async () => {
    await renderFirstLaunch();

    for (let page = 1; page < SLIDES.length; page++) {
      await press('Next');
    }
    // The last page swaps Next for Get started, and Skip is gone.
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Skip onboarding' })).not.toBeOnTheScreen();

    await press('Get started');

    expect(screen.queryByTestId('onboarding')).not.toBeOnTheScreen();
    expect(await storedCompleted()).toBe(true);
  });

  it('can be skipped from the first page', async () => {
    await renderFirstLaunch();

    await press('Skip onboarding');

    expect(screen.queryByTestId('onboarding')).not.toBeOnTheScreen();
    expect(await storedCompleted()).toBe(true);
  });

  it('does not show again once completed', async () => {
    await AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ state: { completed: true }, version: 0 }),
    );
    await useOnboardingStore.persist.rehydrate();

    await render(<OnboardingGate />);

    expect(screen.queryByTestId('onboarding')).not.toBeOnTheScreen();
  });

  it('shows again when replayed', async () => {
    await useOnboardingStore.persist.rehydrate();
    await act(async () => useOnboardingStore.setState({ completed: true }));
    await render(<OnboardingGate />);
    expect(screen.queryByTestId('onboarding')).not.toBeOnTheScreen();

    await act(async () => useOnboardingStore.getState().replay());

    expect(await screen.findByRole('header', { name: SLIDES[0].title })).toBeOnTheScreen();
  });

  // Back must never lead past onboarding into an app the user hasn't been shown yet.
  it('steps back a page on Android back, and leaves back to the system on the first page', async () => {
    await renderFirstLaunch();
    await press('Next');
    await press('Next');

    let handled: boolean | null | undefined;
    await act(async () => {
      handled = pressBack();
    });
    expect(handled).toBe(true);
    await act(async () => {
      handled = pressBack();
    });
    expect(handled).toBe(true);

    await act(async () => {
      handled = pressBack();
    });
    expect(handled).toBe(false);
    expect(screen.getByTestId('onboarding')).toBeOnTheScreen();
    expect(useOnboardingStore.getState().completed).toBe(false);
  });
});
