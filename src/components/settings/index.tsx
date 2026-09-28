import { Switch, Text, View } from 'react-native';

import {
  setPerformancePanelVisible,
  usePerformancePanelVisible,
} from '@/components/performance-panel';
import { ScreenSafeArea } from '@/components/ui/screen-safe-area';

export function Settings() {
  const performancePanelVisible = usePerformancePanelVisible();

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenSafeArea>
        <View className="flex-1 px-5">
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
        </View>
      </ScreenSafeArea>
    </View>
  );
}
