import { Text, View } from 'react-native';

import { StatTile } from './stat-tile';
import type { PerfSnapshot } from './types';
import { formatClock, formatCount, formatMs, fpsFromMs } from './utils';

type SessionSummaryProps = {
  snapshot: PerfSnapshot | null;
};

export function SessionSummary({ snapshot }: SessionSummaryProps) {
  const p50 = snapshot?.p50Ms ?? 0;
  const p95 = snapshot?.p95Ms ?? 0;
  const worst = snapshot?.worstMs ?? 0;

  return (
    <View>
      <View className="mt-3 flex-row items-baseline justify-between px-0.5">
        <Text className="text-[12px] font-bold text-white">Session summary</Text>
        <Text className="text-[10px] text-neutral-400 tabular-nums">
          {formatCount(snapshot?.frames ?? 0)} frames ·{' '}
          {Math.round((snapshot?.elapsedMs ?? 0) / 1000)} s
        </Text>
      </View>
      <View className="mt-1.5 flex-row gap-2">
        <StatTile label="P50" size="md" value={formatMs(p50)} sub={`${fpsFromMs(p50)} FPS`} />
        <StatTile label="P95" size="md" value={formatMs(p95)} sub={`${fpsFromMs(p95)} FPS`} />
        <StatTile
          label="Worst"
          size="md"
          tone="alert"
          value={formatMs(worst)}
          sub={`at ${formatClock(snapshot?.worstAtMs ?? 0)}`}
        />
      </View>
    </View>
  );
}
