import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AccordionShowcase } from '@/components/showcase/accordion-showcase';
import { ImageShowcase } from '@/components/showcase/image-showcase';
import { ShowcaseSheet } from '@/components/showcase/showcase';
import { TripCardShowcase } from '@/components/showcase/trip-card-showcase';
import type { BottomSheetRef, BottomSheetSnap } from '@/components/ui/bottom-sheet/types';
import { ScreenSafeArea } from '@/components/ui/screen-safe-area/screen-safe-area';

export default function ShowcaseScreen() {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [snap, setSnap] = useState<BottomSheetSnap>('closed');
  const [taps, setTaps] = useState(0);

  return (
    <View className="flex-1 bg-neutral-200 dark:bg-neutral-950">
      <ScreenSafeArea>
        <ScrollView contentContainerClassName="gap-10 px-4 pt-6 pb-10">
          <View className="items-center gap-3">
            <Text className="text-2xl font-semibold text-black dark:text-white">
              Behind the sheet
            </Text>
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

          <AccordionShowcase />

          <TripCardShowcase />

          <ImageShowcase />
        </ScrollView>
      </ScreenSafeArea>

      {/* Outside the safe area view: the sheet places itself below the top inset. */}
      <ShowcaseSheet ref={sheetRef} onSnapChange={setSnap} />
    </View>
  );
}
