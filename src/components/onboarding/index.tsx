import { View } from 'react-native';

import Onboarding from './onboarding';
import { useOnboardingHydrated, useOnboardingStore } from './store';

export { replayOnboarding, useOnboardingHydrated } from './store';

// App-wide overlay mounted last in the root layout, so it covers the tabs, sheets and
// performance panel. Imported eagerly, not lazily: a lazy chunk arrives only after the splash
// has hidden (slowly in dev, where Metro serves it over the network), leaving a blank screen.
// Eagerly, onboarding renders in the same commit that lets the root layout hide the splash, so
// the splash gives way straight to it.
export function OnboardingGate() {
  const hydrated = useOnboardingHydrated();
  const completed = useOnboardingStore((state) => state.completed);

  if (!hydrated || completed) return null;

  return (
    <View testID="onboarding" className="absolute inset-0 bg-white dark:bg-black">
      <Onboarding />
    </View>
  );
}
