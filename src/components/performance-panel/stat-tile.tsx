import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

// Shared with the collapsed HUD, whose tiles are the same boxes with UI-thread readouts.
export const TILE_CLASS = 'flex-1 rounded-xl bg-neutral-800 px-2.5 py-2';
export const TILE_LABEL_CLASS = 'text-[9px] font-bold tracking-[1px] text-neutral-400 uppercase';
export const TILE_SUB_CLASS = 'mt-0.5 text-[10px] text-neutral-400';

type StatTileProps = {
  label: string;
  value: string;
  sub?: string;
  size?: 'lg' | 'md';
  tone?: 'default' | 'alert';
  valueColor?: string;
  dotColor?: string;
  children?: ReactNode;
};

export function StatTile({
  label,
  value,
  sub,
  size = 'lg',
  tone = 'default',
  valueColor,
  dotColor,
  children,
}: StatTileProps) {
  const alert = tone === 'alert';

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
      className={
        alert ? 'flex-1 rounded-xl border border-red-900 bg-red-950 px-2.5 py-2' : TILE_CLASS
      }
    >
      <Text
        className={
          alert ? 'text-[9px] font-bold tracking-[1px] text-red-400 uppercase' : TILE_LABEL_CLASS
        }
      >
        {label}
      </Text>
      <View className="mt-1 flex-row items-center gap-1">
        {dotColor ? (
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
        ) : null}
        <Text
          numberOfLines={1}
          className={`shrink font-bold text-white tabular-nums ${
            size === 'lg' ? 'text-[20px] leading-[24px]' : 'text-[14px] leading-[18px]'
          }`}
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </Text>
      </View>
      {sub ? (
        <Text numberOfLines={1} className={TILE_SUB_CLASS}>
          {sub}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
