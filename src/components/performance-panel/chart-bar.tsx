import { memo } from 'react';
import { View } from 'react-native';

import { CHART_HEIGHT, CHART_MAX_MS, HUD_COLORS } from './constants';
import { classifyFrame } from './tracker';

type ChartBarProps = {
  ms: number;
};

// One frame in the frame-time chart. 0 is an empty slot before the window has filled.
export const ChartBar = memo(function ChartBar({ ms }: ChartBarProps) {
  if (ms <= 0) return <View className="flex-1" />;

  const height = Math.max(1, (Math.min(ms, CHART_MAX_MS) / CHART_MAX_MS) * CHART_HEIGHT);
  return (
    <View
      className="flex-1 rounded-t-[1px]"
      style={{ height, backgroundColor: HUD_COLORS[classifyFrame(ms)] }}
    />
  );
});
