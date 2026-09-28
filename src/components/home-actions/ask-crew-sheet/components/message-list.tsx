import { useCallback, useMemo } from 'react';
import { FlatList, type ListRenderItemInfo, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActiveMessages } from '../chat/store';
import type { ChatMessage } from '../chat/types';
import { ChatScrollView } from './chat-scroll-view';
import { MessageBubble } from './message-bubble';

function keyOf(message: ChatMessage) {
  return message.id;
}

function renderItem({ item }: ListRenderItemInfo<ChatMessage>) {
  return <MessageBubble message={item} />;
}

/**
 * Newest message at the bottom. The list is inverted so a streaming reply grows upward from
 * the composer and stays in view without scrolling on every update.
 */
export function MessageList() {
  const messages = useActiveMessages();
  const { bottom } = useSafeAreaInsets();
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);

  // The composer rides the keyboard itself, so the list only needs to clear the keyboard's
  // height above the bottom safe area, which the sheet body already pads.
  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => <ChatScrollView {...props} offset={bottom} />,
    [bottom],
  );

  return (
    <FlatList
      data={newestFirst}
      inverted
      keyExtractor={keyOf}
      renderItem={renderItem}
      renderScrollComponent={renderScrollComponent}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-3 px-5 py-3"
      initialNumToRender={10}
      windowSize={9}
    />
  );
}
