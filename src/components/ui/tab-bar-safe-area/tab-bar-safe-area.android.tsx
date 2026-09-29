import { StyleSheet, View, type ViewProps } from 'react-native';

// Android already lays tab screens out above the tab bar. Its native safe area would also
// re-apply the navigation bar inset after a tab switch and push floating content up.
export function TabBarSafeArea({ style, ...props }: ViewProps) {
  return <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, style]} {...props} />;
}
