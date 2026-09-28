import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { HUD_COLORS } from './constants';
import { formatClock } from './utils';

type HudHeaderProps = {
  elapsedMs: number;
  onCollapse: () => void;
};

export function HudHeader({ elapsedMs, onCollapse }: HudHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View>
        <Text accessibilityRole="header" className="text-[15px] font-bold text-white">
          Performance
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1">
          <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <Text className="text-[11px] text-neutral-400 tabular-nums">
            Recording · {formatClock(elapsedMs)}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Collapse performance panel"
        hitSlop={8}
        onPress={onCollapse}
        className="h-8 w-8 items-center justify-center rounded-full bg-neutral-700 active:opacity-70"
      >
        <Ionicons name="chevron-up" size={16} color={HUD_COLORS.value} />
      </Pressable>
    </View>
  );
}
