import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type MissingKeyNoticeProps = {
  onBeforeNavigate: () => void;
};

/** Shown instead of the chat until an OpenRouter key is saved in Settings. */
export function MissingKeyNotice({ onBeforeNavigate }: MissingKeyNoticeProps) {
  return (
    <View className="flex-1 gap-3 px-5 pt-2">
      <Text className="text-base text-neutral-700 dark:text-neutral-300">
        Crew answers with a model from OpenRouter. Add your OpenRouter key in Settings to start
        chatting.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onBeforeNavigate();
          router.navigate('/settings');
        }}
        className="min-h-11 items-center justify-center self-start rounded-full bg-neutral-900 px-5 dark:bg-white"
      >
        <Text className="text-base font-medium text-white dark:text-black">Open Settings</Text>
      </Pressable>
    </View>
  );
}
