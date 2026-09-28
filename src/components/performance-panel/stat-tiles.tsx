import { View } from 'react-native';

import { HUD_COLORS, NO_BLOCKS } from './constants';
import { StatTile } from './stat-tile';
import type { PerfSnapshot } from './types';
import { fpsColor } from './utils';

type StatTilesProps = {
  snapshot: PerfSnapshot | null;
};

// Top row of design 08: live UI-thread FPS with a bar, drop count, JS thread state.
export function StatTiles({ snapshot }: StatTilesProps) {
  const fps = snapshot?.fps ?? 0;
  const blocked = snapshot?.jsBlocked ?? false;
  const lastBlock = snapshot?.jsLastBlockMs ?? 0;
  const barWidth = `${Math.min(100, Math.round((fps / 60) * 100))}%` as const;

  return (
    <View className="mt-3 flex-row gap-2">
      <StatTile label="UI FPS" value={snapshot ? String(fps) : '–'}>
        <View className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-700">
          <View
            testID="fps-bar"
            className="h-1 rounded-full"
            style={{ width: barWidth, backgroundColor: fpsColor(fps) }}
          />
        </View>
      </StatTile>
      <StatTile label="DROPS" value={String(snapshot?.drops ?? 0)} sub="under 45 FPS" />
      <StatTile
        label="JS THREAD"
        value={blocked ? `${snapshot?.jsStallMs ?? 0} ms` : 'Idle'}
        valueColor={blocked ? HUD_COLORS.blocked : undefined}
        dotColor={blocked ? HUD_COLORS.blocked : HUD_COLORS.idle}
        sub={lastBlock > 0 ? `last block ${lastBlock} ms` : NO_BLOCKS}
      />
    </View>
  );
}
