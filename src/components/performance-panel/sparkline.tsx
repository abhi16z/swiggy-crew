import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { SPARK_BARS, SPARK_HEIGHT } from './constants';
import { SparkBar } from './spark-bar';

const INDICES = Array.from({ length: SPARK_BARS }, (_, index) => index);

type SparklineProps = {
  spark: SharedValue<number[]>;
};

export function Sparkline({ spark }: SparklineProps) {
  return (
    <View
      accessible={false}
      className="flex-row items-end gap-[2px]"
      style={{ height: SPARK_HEIGHT }}
    >
      {INDICES.map((index) => (
        <SparkBar key={index} spark={spark} index={index} />
      ))}
    </View>
  );
}
