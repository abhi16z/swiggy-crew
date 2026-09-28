import { useCallback } from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';

import { useChatStore } from '../chat/store';
import type { Chat } from '../chat/types';
import { ChatListRow } from './chat-list-row';

type ChatListProps = {
  onOpen: (chatId: string) => void;
};

function keyOf(chat: Chat) {
  return chat.id;
}

/** This session's chats, most recently used first. */
export function ChatList({ onOpen }: ChatListProps) {
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Chat>) => (
      <ChatListRow chat={item} active={item.id === activeChatId} onOpen={onOpen} />
    ),
    [activeChatId, onOpen],
  );

  return (
    <FlatList
      data={chats}
      keyExtractor={keyOf}
      renderItem={renderItem}
      contentContainerClassName="gap-1 px-3 py-2"
      initialNumToRender={10}
      windowSize={5}
    />
  );
}
