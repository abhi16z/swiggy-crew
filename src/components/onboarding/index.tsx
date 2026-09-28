import { lazy, Suspense } from 'react';
import { View } from 'react-native';

import { useOnboardingHydrated, useOnboardingStore } from './store';

export { replayOnboarding, useOnboardingHydrated } from './store';

const Onboarding = lazy(() => import('./onboarding'));

// App-wide overlay mounted last in the root layout, so it covers the tabs, sheets and
// performance panel. Its code loads only when it is shown: once, unless replayed.
export function OnboardingGate() {
  const hydrated = useOnboardingHydrated();
  const completed = useOnboardingStore((state) => state.completed);

  if (!hydrated || completed) return null;

  // The opaque backdrop covers Home while the onboarding code loads.
  return (
    <View testID="onboarding" className="absolute inset-0 bg-white dark:bg-black">
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
    </View>
  );
}
