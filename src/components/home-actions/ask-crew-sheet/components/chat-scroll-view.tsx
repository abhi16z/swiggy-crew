import { forwardRef, type ComponentRef } from 'react';
import type { ScrollViewProps } from 'react-native';
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewProps,
} from 'react-native-keyboard-controller';

type ChatScrollViewProps = ScrollViewProps & KeyboardChatScrollViewProps;

/**
 * Scroll container for the message list. It lifts the content with the keyboard on the UI
 * thread without changing the list's layout. FlatList passes `inverted` through.
 */
export const ChatScrollView = forwardRef<
  ComponentRef<typeof KeyboardChatScrollView>,
  ChatScrollViewProps
>(function ChatScrollView(props, ref) {
  return (
    <KeyboardChatScrollView
      ref={ref}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      {...props}
    />
  );
});
