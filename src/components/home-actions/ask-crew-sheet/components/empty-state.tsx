import { Pressable, Text, View } from 'react-native';

import { SUGGESTIONS } from '../chat/constants';
import { sendMessage } from '../chat/store';

type EmptyStateProps = {
  enabled: boolean;
};

export function EmptyState({ enabled }: EmptyStateProps) {
  return (
    <View className="flex-1 gap-3 px-5 pt-2">
      <Text className="text-base text-neutral-700 dark:text-neutral-300">
        Ask about any destination: when to go, what to do, what to pack.
      </Text>
      {enabled
        ? SUGGESTIONS.map((suggestion) => (
            <Pressable
              key={suggestion}
              accessibilityRole="button"
              onPress={() => void sendMessage(suggestion)}
              className="min-h-11 justify-center self-start rounded-full border border-neutral-200 px-4 dark:border-neutral-700"
            >
              <Text className="text-sm text-black dark:text-white">{suggestion}</Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}
