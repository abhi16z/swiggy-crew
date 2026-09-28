import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  BottomSheetFooter,
  useBottomSheetPeekInset,
  type BottomSheetSnap,
} from '@/components/ui/bottom-sheet';
import { loadApiKey, useApiKey, useApiKeyLoaded } from '@/lib/ai-settings';

import { loadDestinations } from './chat/destinations';
import { openChat, startNewChat, useActiveMessages, useChatStore } from './chat/store';
import { ChatHeader } from './components/chat-header';
import { ChatList } from './components/chat-list';
import { Composer } from './components/composer';
import { EmptyState } from './components/empty-state';
import { MessageList } from './components/message-list';
import { MissingKeyNotice } from './components/missing-key-notice';

type AskCrewSheetBodyProps = {
  snap: BottomSheetSnap;
  onSnapTo: (snap: BottomSheetSnap) => void;
};

// Ask Crew chat (designs 04–06). Chat state lives in `chat/store`, so this body can unmount on
// close without losing the chats or a reply that is still streaming.
export default function AskCrewSheetBody({ snap, onSnapTo }: AskCrewSheetBodyProps) {
  const apiKey = useApiKey();
  const keyLoaded = useApiKeyLoaded();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const hasMessages = useActiveMessages().length > 0;
  const peekInset = useBottomSheetPeekInset();
  const [showingChats, setShowingChats] = useState(false);

  useEffect(() => {
    void loadApiKey();
    // Warm the destination list for the system prompt while the user types.
    void loadDestinations();
  }, []);

  const close = useCallback(() => onSnapTo('closed'), [onSnapTo]);
  const expand = useCallback(() => onSnapTo('full'), [onSnapTo]);
  const toggleChats = useCallback(() => setShowingChats((showing) => !showing), []);
  const newChat = useCallback(() => {
    startNewChat();
    setShowingChats(false);
  }, []);
  const open = useCallback((chatId: string) => {
    openChat(chatId);
    setShowingChats(false);
  }, []);

  const canChat = Boolean(apiKey);
  let content = <EmptyState enabled={canChat} />;
  if (showingChats) content = <ChatList onOpen={open} />;
  else if (keyLoaded && !canChat) content = <MissingKeyNotice onBeforeNavigate={close} />;
  // Keyed by chat, so switching chats starts at that chat's newest message.
  else if (hasMessages) content = <MessageList key={activeChatId} />;

  return (
    <View className="flex-1">
      <ChatHeader
        showingChats={showingChats}
        onToggleChats={toggleChats}
        onNewChat={newChat}
        onClose={close}
      />
      {/* At half height the footer is lifted over the body's hidden bottom part; end the
          content above it. Changes once per snap, never during a drag. */}
      <View className="flex-1" style={{ marginBottom: snap === 'full' ? 0 : peekInset }}>
        {content}
      </View>
      {showingChats ? null : (
        <BottomSheetFooter>
          <Composer enabled={canChat} onEngage={expand} />
        </BottomSheetFooter>
      )}
    </View>
  );
}
