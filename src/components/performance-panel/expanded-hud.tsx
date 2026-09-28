import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FrameChart } from './frame-chart';
import { HudActions } from './hud-actions';
import { HudHeader } from './hud-header';
import { SessionSummary } from './session-summary';
import { useSnapshot } from './snapshot-store';
import { StatTiles } from './stat-tiles';
import { setPerformancePanelVisible } from './store';
import type { PerfTracker } from './use-perf-tracker';

type ExpandedHudProps = {
  tracker: PerfTracker;
  onCollapse: () => void;
};

const NO_FRAMES: number[] = [];

// Same as switching the panel off in Settings, so it stays off after a restart.
function closePanel() {
  setPerformancePanelVisible(false);
}

// Design 08. Re-renders 4 times a second from the snapshot the UI thread publishes; nothing
// outside this card subscribes to it.
export function ExpandedHud({ tracker, onCollapse }: ExpandedHudProps) {
  const snapshot = useSnapshot();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Android back collapses the card instead of leaving the screen behind it.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onCollapse();
      return true;
    });
    return () => subscription.remove();
  }, [onCollapse]);

  return (
    <View
      accessibilityLabel="Performance HUD"
      className="mx-3 mt-1 overflow-hidden rounded-[20px] bg-neutral-900"
      style={[styles.continuousCorners, { maxHeight: height - insets.top - insets.bottom - 24 }]}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-3"
      >
        <HudHeader
          elapsedMs={snapshot?.elapsedMs ?? 0}
          onCollapse={onCollapse}
          onClose={closePanel}
        />
        <StatTiles snapshot={snapshot} />
        <FrameChart recent={snapshot?.recent ?? NO_FRAMES} />
        <SessionSummary snapshot={snapshot} />
        <HudActions onReset={tracker.reset} />
        <Text className="mt-2 text-center text-[10px] text-neutral-500">
          Every frame sampled on the UI thread · redraws 4× a second
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  continuousCorners: { borderCurve: 'continuous' },
});
