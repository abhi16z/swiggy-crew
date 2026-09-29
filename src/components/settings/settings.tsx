import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Switch, Text, useColorScheme, View } from 'react-native';

import { replayOnboarding } from '@/components/onboarding/store';
import {
  setPerformancePanelVisible,
  usePerformancePanelVisible,
} from '@/components/performance-panel/store';
import { ScreenSafeArea } from '@/components/ui/screen-safe-area/screen-safe-area';
import { ICON_COLORS } from '@/constants/colors';

import { OpenRouterSettings } from './open-router/open-router';

export function Settings() {
  const performancePanelVisible = usePerformancePanelVisible();
  const iconColor = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'].muted;

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Replay onboarding"
            onPress={replayOnboarding}
            className="min-h-11 flex-row items-center justify-between active:opacity-60"
          >
            <Text className="text-base text-black dark:text-white">Replay onboarding</Text>
            <Ionicons name="play-circle-outline" size={22} color={iconColor} />
          </Pressable>
          <OpenRouterSettings />
        </View>
      </ScreenSafeArea>
    </View>
  );
}
