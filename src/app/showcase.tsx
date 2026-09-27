import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ShowcaseSheet, type BottomSheetRef, type BottomSheetSnap } from '@/components/showcase';

export default function ShowcaseScreen() {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [snap, setSnap] = useState<BottomSheetSnap>('closed');
  const [taps, setTaps] = useState(0);

  return (
    <View className="flex-1 bg-neutral-200 dark:bg-neutral-950">
      <View className="items-center gap-3 px-6 pt-16">
        <Text className="text-2xl font-semibold text-black dark:text-white">Behind the sheet</Text>
        <Text className="text-base text-neutral-700 dark:text-neutral-300">
          Current stop: {snap}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => sheetRef.current?.snapTo('half')}
          className="min-h-11 items-center justify-center rounded-full bg-neutral-900 px-5 dark:bg-white"
        >
          <Text className="text-base font-medium text-white dark:text-black">Open sheet</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTaps((count) => count + 1)}
          className="min-h-11 items-center justify-center rounded-full bg-white px-5 dark:bg-neutral-800"
        >
          <Text className="text-base font-medium text-black dark:text-white">
            Tap behind · {taps}
          </Text>
        </Pressable>
      </View>

      <ShowcaseSheet ref={sheetRef} onSnapChange={setSnap} />
    </View>
  );
}
