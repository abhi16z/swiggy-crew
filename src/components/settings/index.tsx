import { Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  setPerformancePanelVisible,
  usePerformancePanelVisible,
} from '@/components/performance-panel';

import { OpenRouterSettings } from './open-router';

export function Settings() {
  const insets = useSafeAreaInsets();
  const performancePanelVisible = usePerformancePanelVisible();

  return (
    <View className="flex-1 bg-white px-5 dark:bg-black" style={{ paddingTop: insets.top }}>
      {/* Taller than the compact performance panel, so the settings below stay uncovered. */}
      <Text
        accessibilityRole="header"
        className="pt-4 pb-6 text-4xl font-bold text-black dark:text-white"
      >
        Settings
      </Text>
      <View className="min-h-11 flex-row items-center justify-between">
        <Text className="text-base text-black dark:text-white">Performance panel</Text>
        <Switch
          accessibilityLabel="Performance panel"
          value={performancePanelVisible}
          onValueChange={setPerformancePanelVisible}
        />
      </View>
      <OpenRouterSettings />
    </View>
  );
}
