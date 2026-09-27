import { Pressable, Text, View } from 'react-native';

import type { BottomSheetSnap } from '@/components/ui/bottom-sheet';

type ShowcaseSheetBodyProps = {
  onSnapTo: (snap: BottomSheetSnap) => void;
};

export default function ShowcaseSheetBody({ onSnapTo }: ShowcaseSheetBodyProps) {
  return (
    <View className="gap-4 px-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-black dark:text-white">Sheet</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          onPress={() => onSnapTo('closed')}
          className="min-h-11 items-center justify-center rounded-full px-4"
        >
          <Text className="text-base font-medium text-black dark:text-white">Close</Text>
        </Pressable>
      </View>
      <Text className="text-base leading-6 text-neutral-700 dark:text-neutral-300">
        Drag up for full height. Drag down to the bottom to close. A flick commits to the next stop.
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => onSnapTo('half')}
          className="min-h-11 flex-1 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800"
        >
          <Text className="text-base font-medium text-black dark:text-white">Middle</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSnapTo('full')}
          className="min-h-11 flex-1 items-center justify-center rounded-full bg-neutral-900 dark:bg-white"
        >
          <Text className="text-base font-medium text-white dark:text-black">Full</Text>
        </Pressable>
      </View>
    </View>
  );
}
