import { Pressable, Text, View } from 'react-native';

import type { BottomSheetSnap } from '@/components/ui/bottom-sheet';

type FiltersSheetBodyProps = {
  onSnapTo: (snap: BottomSheetSnap) => void;
};

// Entry point for the Filters sheet body (design 10).
export default function FiltersSheetBody({ onSnapTo }: FiltersSheetBodyProps) {
  return (
    <View className="flex-row items-center justify-between px-5">
      <Text className="text-xl font-semibold text-black dark:text-white">Filters</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close filters"
        onPress={() => onSnapTo('closed')}
        className="min-h-11 items-center justify-center rounded-full px-4"
      >
        <Text className="text-base font-medium text-black dark:text-white">Close</Text>
      </Pressable>
    </View>
  );
}
