import { ActivityIndicator, Text, View } from 'react-native';

export function FiltersSheetFallback() {
  return (
    <View className="min-h-11 flex-row items-center gap-3 px-5">
      <ActivityIndicator />
      <Text className="text-base text-neutral-700 dark:text-neutral-300">Loading filters</Text>
    </View>
  );
}
