import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { HUD_COLORS, SPARK_HEIGHT, SPARK_MAX_MS, SPARK_MIN_HEIGHT } from './constants';
import { classifyFrame } from './tracker';

type SparkBarProps = {
  spark: SharedValue<number[]>;
  index: number;
};

// One bar of the compact sparkline: the worst frame of one redraw interval, styled on the
// UI thread from the shared array the frame callback writes.
export function SparkBar({ spark, index }: SparkBarProps) {
  const style = useAnimatedStyle(() => {
    const ms = spark.get()[index];
    const ratio = Math.min(ms, SPARK_MAX_MS) / SPARK_MAX_MS;
    return {
      height: Math.max(SPARK_MIN_HEIGHT, ratio * SPARK_HEIGHT),
      backgroundColor: ms > 0 ? HUD_COLORS[classifyFrame(ms)] : HUD_COLORS.guide,
    };
  });

  return <Animated.View className="w-[2px] rounded-[1px]" style={style} />;
}
