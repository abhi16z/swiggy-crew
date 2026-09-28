import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { FADE_IN_END, FADE_OUT_START, SCENE_HEIGHT, SCENE_MAX_WIDTH } from '../constants';
import { phase } from './use-scene-loop';

type SceneFrameProps = {
  progress: SharedValue<number>;
  children: ReactNode;
};

// The rounded "screen" every scene is drawn in. Its content fades in at the start of each loop
// and out at the end, so the restart is never a cut. The scene is decorative: the page's title
// and text say the same thing to screen readers.
export function SceneFrame({ progress, children }: SceneFrameProps) {
  const fade = useAnimatedStyle(() => {
    const p = progress.get();
    return { opacity: phase(p, 0, FADE_IN_END) * (1 - phase(p, FADE_OUT_START, 1)) };
  });

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="w-full overflow-hidden rounded-[28px] bg-neutral-100 dark:bg-neutral-900"
      style={styles.frame}
    >
      <Animated.View style={[styles.fill, fade]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: SCENE_HEIGHT, maxWidth: SCENE_MAX_WIDTH, borderCurve: 'continuous' },
  fill: { flex: 1 },
});
