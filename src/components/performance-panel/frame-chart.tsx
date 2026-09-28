import { useCallback, useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

import { ChartBar } from './chart-bar';
import {
  BUDGET_MS,
  CHART_HEIGHT,
  CHART_MAX_MS,
  DROP_MS,
  HUD_COLORS,
  RECENT_FRAMES,
} from './constants';
import { formatMs } from './utils';

type FrameChartProps = {
  /** Frame times, oldest first. Fewer than `RECENT_FRAMES` leaves empty slots on the left. */
  recent: number[];
};

const CALLOUT_WIDTH = 56;
const CALLOUT_SPACE = 22;
const AXIS_WIDTH = 28;
// Line height of the 10 px axis labels, to hang the budget label under its line.
const AXIS_LABEL_HEIGHT = 13;

const LEGEND = [
  { label: 'On budget', color: HUD_COLORS.onBudget },
  { label: 'Slow', color: HUD_COLORS.slow },
  { label: 'Dropped', color: HUD_COLORS.dropped },
];

function yFor(ms: number) {
  return (Math.min(ms, CHART_MAX_MS) / CHART_MAX_MS) * CHART_HEIGHT;
}

// "Frame time" card of design 08: one bar per frame, reference lines at the budget and the
// drop threshold, and a callout over the worst dropped frame in the window.
export function FrameChart({ recent }: FrameChartProps) {
  const [plotWidth, setPlotWidth] = useState(0);
  const onPlotLayout = useCallback(
    (event: LayoutChangeEvent) => setPlotWidth(event.nativeEvent.layout.width),
    [],
  );

  const { bars, worst, worstIndex, seconds } = useMemo(() => {
    const padded = new Array<number>(Math.max(0, RECENT_FRAMES - recent.length))
      .fill(0)
      .concat(recent);
    let max = 0;
    let maxIndex = -1;
    let total = 0;
    padded.forEach((ms, index) => {
      total += ms;
      if (ms > max) {
        max = ms;
        maxIndex = index;
      }
    });
    return {
      bars: padded,
      worst: max,
      worstIndex: maxIndex,
      seconds: Math.max(1, Math.round(total / 1000)),
    };
  }, [recent]);

  const showCallout = worst > DROP_MS && plotWidth > CALLOUT_WIDTH;
  const calloutLeft = Math.min(
    Math.max(0, ((worstIndex + 0.5) / bars.length) * plotWidth - CALLOUT_WIDTH / 2),
    plotWidth - CALLOUT_WIDTH,
  );

  return (
    <View className="mt-2 rounded-xl bg-neutral-800 px-2.5 py-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold text-white">Frame time</Text>
        <Text className="text-[10px] text-neutral-400">last {RECENT_FRAMES} UI frames</Text>
      </View>

      <View className="mt-1 flex-row" style={{ height: CHART_HEIGHT + CALLOUT_SPACE }}>
        <View className="flex-1" onLayout={onPlotLayout} testID="frame-chart-plot">
          <View
            className="absolute inset-x-0 bottom-0 flex-row items-end gap-px"
            style={{ height: CHART_HEIGHT }}
          >
            {bars.map((ms, index) => (
              <ChartBar key={index} ms={ms} />
            ))}
          </View>
          <View
            pointerEvents="none"
            className="absolute inset-x-0 h-px bg-neutral-500"
            style={{ bottom: yFor(BUDGET_MS) }}
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-0 h-px bg-red-500"
            style={{ bottom: yFor(DROP_MS) }}
          />
          {showCallout ? (
            <View
              className="absolute items-center rounded-full border border-red-800 bg-red-950 py-0.5"
              style={{ left: calloutLeft, width: CALLOUT_WIDTH, bottom: CHART_HEIGHT + 3 }}
            >
              <Text className="text-[10px] font-semibold text-red-400 tabular-nums">
                {formatMs(worst)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ width: AXIS_WIDTH }}>
          <Text className="absolute top-0 right-0 text-[10px] text-neutral-400">ms</Text>
          <Text
            className="absolute right-0 text-[10px] text-red-400"
            style={{ bottom: yFor(DROP_MS) + 1 }}
          >
            22.2
          </Text>
          <Text
            className="absolute right-0 text-[10px] text-neutral-300"
            style={{ bottom: yFor(BUDGET_MS) - AXIS_LABEL_HEIGHT }}
          >
            16.7
          </Text>
        </View>
      </View>

      <View className="mt-0.5 flex-row justify-between">
        <Text className="text-[10px] text-neutral-400">−{seconds} s</Text>
        <Text className="text-[10px] text-neutral-400" style={{ marginRight: AXIS_WIDTH }}>
          now
        </Text>
      </View>

      <View className="mt-1.5 flex-row gap-3">
        {LEGEND.map(({ label, color }) => (
          <View key={label} className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
            <Text className="text-[10px] text-neutral-300">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
