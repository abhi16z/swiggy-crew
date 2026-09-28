import { useState } from 'react';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICON_COLORS } from '@/constants/colors';

import { getDraft, sendMessage, setDraft, stopReply, useActiveChatStreaming } from '../chat/store';

type ComposerProps = {
  enabled: boolean;
  /** Called on touch-down and focus; the sheet expands before the keyboard opens. */
  onEngage: () => void;
};

export function Composer({ enabled, onEngage }: ComposerProps) {
  const streaming = useActiveChatStreaming();
  const placeholderColor = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'].muted;
  const { bottom } = useSafeAreaInsets();
  const [text, setText] = useState(getDraft);

  const change = (value: string) => {
    setText(value);
    setDraft(value);
  };

  const canSend = enabled && !streaming && text.trim() !== '';

  const send = () => {
    if (!canSend) return;
    const message = text;
    change('');
    void sendMessage(message);
  };

  // The sheet body already pads by the bottom safe area, which the keyboard covers; subtract
  // it so the input sits directly on top of the keyboard.
  return (
    <KeyboardStickyView offset={{ opened: bottom }}>
      <View className="flex-row items-end gap-2 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <TextInput
          accessibilityLabel="Message Crew"
          placeholder={enabled ? 'Ask about a destination' : 'Add an OpenRouter key to chat'}
          placeholderTextColor={placeholderColor}
          value={text}
          onChangeText={change}
          onPressIn={onEngage}
          onFocus={onEngage}
          editable={enabled}
          multiline
          maxLength={2000}
          className="max-h-28 min-h-11 flex-1 rounded-2xl bg-neutral-100 px-4 py-2.5 text-base text-black dark:bg-neutral-800 dark:text-white"
        />
        {streaming ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop reply"
            onPress={stopReply}
            className="min-h-11 items-center justify-center rounded-full border border-neutral-300 px-4 dark:border-neutral-600"
          >
            <Text className="text-base font-medium text-black dark:text-white">Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={send}
            className={`min-h-11 items-center justify-center rounded-full bg-neutral-900 px-4 dark:bg-white ${canSend ? '' : 'opacity-40'}`}
          >
            <Text className="text-base font-medium text-white dark:text-black">Send</Text>
          </Pressable>
        )}
      </View>
    </KeyboardStickyView>
  );
}
