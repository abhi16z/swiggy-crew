import { Pressable, Text, View } from 'react-native';

import type { BottomSheetSnap } from '@/components/ui/bottom-sheet';

type AskCrewSheetBodyProps = {
  onSnapTo: (snap: BottomSheetSnap) => void;
};

// Entry point for the Ask Crew chat body (designs 04–06).
export default function AskCrewSheetBody({ onSnapTo }: AskCrewSheetBodyProps) {
  return (
    <View className="flex-row items-center justify-between px-5">
      <Text className="text-xl font-semibold text-black dark:text-white">Ask Crew</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close Ask Crew"
        onPress={() => onSnapTo('closed')}
        className="min-h-11 items-center justify-center rounded-full px-4"
      >
        <Text className="text-base font-medium text-black dark:text-white">Close</Text>
      </Pressable>
    </View>
  );
}
