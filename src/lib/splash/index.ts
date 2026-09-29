import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hides the splash that `keep-splash-visible` holds up. Call it in the root layout: its tree is
 * mounted by the time effects run, so the splash gives way to the app, never to a blank screen.
 * Pass `ready = false` to keep it up a little longer, e.g. until saved state decides which
 * screen shows first.
 */
export function useHideSplashScreen(ready = true) {
  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);
}
