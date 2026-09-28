import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isStreaming } from '../chat/store';
import type { Chat } from '../chat/types';

type ChatListRowProps = {
  chat: Chat;
  active: boolean;
  onOpen: (chatId: string) => void;
};

function preview(chat: Chat) {
  if (isStreaming(chat)) return 'Replying…';
  const last = chat.messages[chat.messages.length - 1];
  return last?.content.trim() || 'No reply';
}

// Memoised on the chat object: while one chat streams, only its row re-renders.
export const ChatListRow = memo(function ChatListRow({ chat, active, onOpen }: ChatListRowProps) {
  const subtitle = preview(chat);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${chat.title}. ${subtitle}`}
      accessibilityState={{ selected: active }}
      onPress={() => onOpen(chat.id)}
      className={`min-h-16 flex-row items-center gap-3 rounded-2xl px-4 py-2.5 ${active ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
    >
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-base font-medium text-black dark:text-white">
          {chat.title}
        </Text>
        <Text numberOfLines={1} className="text-sm text-neutral-600 dark:text-neutral-400">
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
});
