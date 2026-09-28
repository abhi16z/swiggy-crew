import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type ReadoutProps = {
  value: SharedValue<string>;
  initial: string;
  style?: StyleProp<AnimatedStyle<TextStyle>>;
  testID?: string;
};

// A read-only TextInput whose text is set from the UI thread. React never re-renders it, and
// it keeps updating while the JS thread is blocked, which is exactly when it matters.
// NativeWind does not style animated components, so this one uses StyleSheet.
export function Readout({ value, initial, style, testID }: ReadoutProps) {
  // `text` drives the native view. TextInput ignores a `text` prop from React and renders
  // `defaultValue` instead, so `defaultValue` must track the value too: Reanimated hands a
  // value that stopped changing back to React, and passes the current value as a prop on mount.
  // Without it the readout falls back to `initial` (e.g. FPS shows "–" while idle).
  const animatedProps = useAnimatedProps<TextInputProps & { text?: string }>(() => {
    const text = value.get();
    return { text, defaultValue: text };
  });

  return (
    <AnimatedTextInput
      accessible={false}
      animatedProps={animatedProps}
      caretHidden
      defaultValue={initial}
      editable={false}
      importantForAccessibility="no"
      pointerEvents="none"
      style={[styles.readout, style]}
      testID={testID}
      underlineColorAndroid="transparent"
    />
  );
}

const styles = StyleSheet.create({
  readout: {
    margin: 0,
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontVariant: ['tabular-nums'],
  },
});
