import { SplashScreen } from 'expo-router';

// Imported first by the root layout, before its heavy imports run. Otherwise the splash can
// hide while the first screen is still rendering, and a blank screen shows in between.
// The root layout hides it once its first tree is on screen.
void SplashScreen.preventAutoHideAsync();
