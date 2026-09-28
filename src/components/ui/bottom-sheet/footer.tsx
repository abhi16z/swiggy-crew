import { useColorScheme, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useBottomSheetContext } from './context';
import { footerOffset, surfaceColor } from './utils';

/**
 * Keeps its children on the visible bottom edge of the sheet. At half height the sheet's own
 * bottom is below the screen, so the footer counter-translates on the UI thread (no layout
 * per frame). It paints the sheet's surface color so content scrolling under it stays hidden.
 * Render it as the last child of the sheet body.
 */
export function BottomSheetFooter({ style, ...props }: ViewProps) {
  const scheme = useColorScheme();
  const { translateY, halfY } = useBottomSheetContext('BottomSheetFooter');

  const pinned = useAnimatedStyle(() => ({
    transform: [{ translateY: footerOffset(translateY.get(), halfY.get()) }],
  }));

  return (
    <Animated.View {...props} style={[{ backgroundColor: surfaceColor(scheme) }, style, pinned]} />
  );
}
