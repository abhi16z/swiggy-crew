import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { COPIED_FEEDBACK_MS, HUD_COLORS } from './constants';
import { useSnapshotStore } from './snapshot-store';
import { buildReport } from './utils';

type HudActionsProps = {
  onReset: () => void;
};

const DARK = '#171717';

export function HudActions({ onReset }: HudActionsProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Reads the store directly so these buttons don't re-render on every redraw.
  const copy = useCallback(async () => {
    const snapshot = useSnapshotStore.getState().snapshot;
    if (!snapshot) return;
    await Clipboard.setStringAsync(buildReport(snapshot));
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, []);

  return (
    <View className="mt-2 flex-row gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset session"
        onPress={onReset}
        className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-neutral-600 active:opacity-70"
      >
        <Ionicons name="refresh-outline" size={15} color={HUD_COLORS.value} />
        <Text className="text-[13px] font-bold text-white">Reset</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Copy report"
        onPress={copy}
        className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-white active:opacity-70"
      >
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={DARK} />
        <Text className="text-[13px] font-bold text-neutral-900">
          {copied ? 'Copied' : 'Copy report'}
        </Text>
      </Pressable>
    </View>
  );
}
