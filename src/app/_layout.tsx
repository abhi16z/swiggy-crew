import '../../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { HomeSheets } from '@/components/home-actions';
import { PerformancePanel } from '@/components/performance-panel';

// Order is paint order: sheets cover the tab bar, the performance panel covers the sheets.
// KeyboardProvider drives keyboard-following UI (the Ask Crew input) on the UI thread.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <AppTabs />
          <HomeSheets />
          <PerformancePanel />
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
