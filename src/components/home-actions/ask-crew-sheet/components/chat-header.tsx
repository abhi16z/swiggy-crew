import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { ICON_COLORS } from '@/components/trip-card/constants';

import { useActiveMessages, useChatStore } from '../chat/store';

type ChatHeaderProps = {
  showingChats: boolean;
  onToggleChats: () => void;
  onNewChat: () => void;
  onClose: () => void;
};

type IconName = ComponentProps<typeof Ionicons>['name'];

/** One slim row: title, then icon buttons for all chats, a new chat, and close. */
export function ChatHeader({ showingChats, onToggleChats, onNewChat, onClose }: ChatHeaderProps) {
  const colors = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const hasChats = useChatStore((state) => state.chats.length > 0);
  const hasMessages = useActiveMessages().length > 0;

  const button = (icon: IconName, label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full"
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
    </Pressable>
  );

  let chatsButton = null;
  if (showingChats) chatsButton = button('chevron-back', 'Back to chat', onToggleChats);
  else if (hasChats) chatsButton = button('chatbubbles-outline', 'All chats', onToggleChats);

  return (
    <View className="flex-row items-center pr-2.5 pl-5">
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 text-xl font-semibold text-black dark:text-white"
      >
        {showingChats ? 'All chats' : 'Ask Crew'}
      </Text>
      {chatsButton}
      {showingChats || hasMessages ? button('create-outline', 'Start a new chat', onNewChat) : null}
      {button('close', 'Close Ask Crew', onClose)}
    </View>
  );
}
