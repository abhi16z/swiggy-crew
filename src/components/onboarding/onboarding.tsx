import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { PagerDots } from './pager-dots';
import { SLIDES } from './slides';
import { useOnboardingStore } from './store';

const EDGES: Edge[] = ['top', 'bottom'];
const LAST_PAGE = SLIDES.length - 1;

// First-launch walkthrough: swipe or tap Next through the pages. Skip and Get started both
// finish it for good. Android back steps to the previous page; on the first page it leaves the
// app as usual, never to a Home screen the user hasn't been shown yet.
export default function Onboarding() {
  const { width } = useWindowDimensions();
  const complete = useOnboardingStore((state) => state.complete);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [page, setPage] = useState(0);
  // Pages in a horizontal ScrollView don't stretch to its height on every platform (web
  // doesn't), so each page gets the measured height and centres its picture in it.
  const [pageHeight, setPageHeight] = useState<number>();
  const last = page === LAST_PAGE;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.set(event.contentOffset.x);
  });

  // React hears about swipes only when the page changes, not on every scroll event.
  useAnimatedReaction(
    () => Math.round(scrollX.get() / Math.max(width, 1)),
    (next, previous) => {
      if (previous !== null && next !== previous) scheduleOnRN(setPage, next);
    },
    [width],
  );

  const goTo = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({ x: index * width, animated: true });
      setPage(index);
    },
    [scrollRef, width],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (page === 0) return false;
      goTo(page - 1);
      return true;
    });
    return () => subscription.remove();
  }, [page, goTo]);

  const next = () => (last ? complete() : goTo(page + 1));

  return (
    <SafeAreaView edges={EDGES} style={styles.fill}>
      <View className="h-12 flex-row items-center justify-end px-3">
        {/* Kept in the layout on the last page so nothing shifts; Get started replaces it. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          accessibilityElementsHidden={last}
          importantForAccessibility={last ? 'no-hide-descendants' : 'auto'}
          disabled={last}
          onPress={complete}
          className={`min-h-11 justify-center px-3 active:opacity-60 ${last ? 'opacity-0' : ''}`}
        >
          <Text className="text-base font-medium text-neutral-500 dark:text-neutral-400">Skip</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}
        style={styles.fill}
      >
        {SLIDES.map(({ key, title, body, Scene }, index) => (
          <View key={key} style={{ width, height: pageHeight }} className="px-6">
            <View className="flex-1 items-center justify-center">
              <Scene active={index === page} />
            </View>
            <View className="min-h-28 gap-2 pt-6">
              <Text
                accessibilityRole="header"
                className="text-3xl font-bold tracking-tight text-black dark:text-white"
              >
                {title}
              </Text>
              <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
                {body}
              </Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      <View className="gap-6 px-6 pt-4 pb-4">
        <PagerDots count={SLIDES.length} scrollX={scrollX} pageWidth={width} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={last ? 'Get started' : 'Next'}
          onPress={next}
          className="min-h-14 items-center justify-center rounded-full bg-neutral-900 active:opacity-70 dark:bg-white"
        >
          <Text className="text-lg font-semibold text-white dark:text-black">
            {last ? 'Get started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
