import { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { retryReply } from '../chat/store';
import type { ChatMessage } from '../chat/types';

type MessageBubbleProps = {
  message: ChatMessage;
};

// Memoised on the message object: while a reply streams, only its own bubble re-renders.
export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <View className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-neutral-900 px-4 py-2.5 dark:bg-white">
        <Text selectable className="text-base text-white dark:text-black">
          {message.content}
        </Text>
      </View>
    );
  }

  if (message.status === 'streaming' && message.content === '') {
    return (
      <View
        accessibilityLabel="Crew is thinking"
        accessibilityLiveRegion="polite"
        className="min-h-11 flex-row items-center gap-2 self-start rounded-2xl rounded-bl-md bg-neutral-100 px-4 dark:bg-neutral-800"
      >
        <ActivityIndicator size="small" />
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">Thinking…</Text>
      </View>
    );
  }

  return (
    <View className="max-w-[92%] gap-1 self-start">
      {message.content !== '' ? (
        <View className="rounded-2xl rounded-bl-md bg-neutral-100 px-4 py-2.5 dark:bg-neutral-800">
          <Text selectable className="text-base leading-6 text-black dark:text-white">
            {message.content}
          </Text>
        </View>
      ) : null}
      {message.status === 'stopped' ? (
        <Text className="px-1 text-xs text-neutral-500 dark:text-neutral-400">Stopped</Text>
      ) : null}
      {message.status === 'error' ? (
        <View className="flex-row flex-wrap items-center gap-x-2 px-1">
          <Text className="shrink text-sm text-red-600 dark:text-red-400">{message.error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry this reply"
            onPress={() => retryReply(message.id)}
            className="min-h-11 justify-center"
          >
            <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});
