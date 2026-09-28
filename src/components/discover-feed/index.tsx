import { Text, View } from 'react-native';

// Entry point for the Discover feed (designs 01–03). Rendered by the Home tab.
export function DiscoverFeed() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-base text-neutral-700 dark:text-neutral-300">Discover feed</Text>
    </View>
  );
}
