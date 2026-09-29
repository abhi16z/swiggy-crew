import { StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

// iOS lays tab screens out under the native tab bar; this pads the bottom by the tab bar's
// inset so floating content stays above it. Fills its parent, passing touches through.
export function TabBarSafeArea({ style, ...props }: ViewProps) {
  return (
    <SafeAreaView
      edges={{ bottom: true }}
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, style]}
      {...props}
    />
  );
}
