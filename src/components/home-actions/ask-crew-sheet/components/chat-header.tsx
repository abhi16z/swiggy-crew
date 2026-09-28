import { Pressable, Text, View } from 'react-native';

import { clearChat, useChatStore } from '../chat/store';

type ChatHeaderProps = {
  onClose: () => void;
};

export function ChatHeader({ onClose }: ChatHeaderProps) {
  const hasMessages = useChatStore((state) => state.messages.length > 0);

  return (
    <View className="flex-row items-center justify-between px-5">
      <Text accessibilityRole="header" className="text-xl font-semibold text-black dark:text-white">
        Ask Crew
      </Text>
      <View className="flex-row items-center">
        {hasMessages ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start a new chat"
            onPress={clearChat}
            className="min-h-11 items-center justify-center rounded-full px-3"
          >
            <Text className="text-base font-medium text-blue-600 dark:text-blue-400">New chat</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Ask Crew"
          onPress={onClose}
          className="min-h-11 items-center justify-center rounded-full px-3"
        >
          <Text className="text-base font-medium text-black dark:text-white">Close</Text>
        </Pressable>
      </View>
    </View>
  );
}
