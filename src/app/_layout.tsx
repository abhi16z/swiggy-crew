import '../../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppTabs />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
