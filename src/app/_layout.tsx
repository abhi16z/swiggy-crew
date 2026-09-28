import '../../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { HomeSheets } from '@/components/home-actions';
import { PerformancePanel } from '@/components/performance-panel';

// Order is paint order: sheets cover the tab bar, the performance panel covers the sheets.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppTabs />
        <HomeSheets />
        <PerformancePanel />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
