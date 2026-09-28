import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

// The app is portrait only, and the bottom belongs to the native tab bar (see TabBarSafeArea).
const EDGES: Edge[] = ['top'];

type ScreenSafeAreaProps = {
  children: ReactNode;
};

// Wrap every tab page's content so it starts below the status bar and notch. It has no
// background of its own: put it inside the page's background view so the inset matches.
// Takes no className (NativeWind doesn't style third-party views): lay out an inner View.
export function ScreenSafeArea({ children }: ScreenSafeAreaProps) {
  return (
    <SafeAreaView edges={EDGES} style={styles.fill}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
