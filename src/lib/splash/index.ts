import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hides the splash that `keep-splash-visible` holds up. Call it in the root layout: its tree is
 * mounted by the time effects run, so the splash gives way to the app, never to a blank screen.
 */
export function useHideSplashScreen() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);
}
