import * as Haptics from 'expo-haptics';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  StyleSheet,
  useColorScheme,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import {
  FLICK_VELOCITY,
  PAN_TEST_ID,
  PRESENT_MS,
  PROJECT_SECONDS,
  REDUCE_MOTION_MS,
} from './constants';
import type { BottomSheetProps, BottomSheetRef, BottomSheetSnap } from './types';
import {
  closedOffset,
  halfOffset,
  handleColor,
  nearestOffset,
  neighborOffset,
  offsetFor,
  resist,
  settle,
  snapIndex,
  surfaceColor,
} from './utils';

export type { BottomSheetProps, BottomSheetRef, BottomSheetSnap } from './types';

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { children, initialSnap = 'half', onSnapChange, onClosed },
  ref,
) {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [interactive, setInteractive] = useState(initialSnap !== 'closed');

  const translateY = useSharedValue(0);
  const dragOrigin = useSharedValue(0);
  const halfY = useSharedValue(0);
  const band = useSharedValue(1);
  const resting = useSharedValue(snapIndex(initialSnap));
  const dismissed = useSharedValue(initialSnap === 'closed' ? 1 : 0);
  const isDragging = useSharedValue(false);
  const reduceMotionSv = useSharedValue(reduceMotion);
  const topInsetSv = useSharedValue(insets.top);
  const parentHeight = useRef(0);
  const placedTopInset = useRef(-1);

  useEffect(() => {
    reduceMotionSv.set(reduceMotion);
  }, [reduceMotion, reduceMotionSv]);
  const lastSnap = useRef<BottomSheetSnap>(initialSnap);
  const onSnapChangeRef = useRef(onSnapChange);
  onSnapChangeRef.current = onSnapChange;
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const emitSnap = useCallback((snap: BottomSheetSnap) => {
    if (lastSnap.current === snap) return;
    lastSnap.current = snap;
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSnapChangeRef.current?.(snap);
  }, []);

  const markClosed = useCallback(() => {
    setInteractive(false);
    onClosedRef.current?.();
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .withTestId(PAN_TEST_ID)
        .maxPointers(1)
        .activeOffsetY([-10, 10])
        .failOffsetX([-24, 24])
        .onStart((event) => {
          if (dismissed.get() === 1) return;
          cancelAnimation(translateY);
          dragOrigin.set(translateY.get() - event.translationY);
          isDragging.set(true);
        })
        .onUpdate((event) => {
          if (dismissed.get() === 1) return;
          const raw = dragOrigin.get() + event.translationY;
          const closedY = closedOffset(band.get(), topInsetSv.get());
          translateY.set(resist(raw, 0, closedY, band.get()));
        })
        .onEnd((event) => {
          if (dismissed.get() === 1) return;
          const half = halfY.get();
          const closedY = closedOffset(band.get(), topInsetSv.get());
          const current = translateY.get();
          const velocity = event.velocityY;
          const projected = current + velocity * PROJECT_SECONDS;
          let dest = nearestOffset(projected, 0, half, closedY);
          if (velocity <= -FLICK_VELOCITY) dest = neighborOffset(current, -1, 0, half, closedY);
          if (velocity >= FLICK_VELOCITY) dest = neighborOffset(current, 1, 0, half, closedY);
          const next = Math.abs(dest - closedY) < 1 ? 2 : Math.abs(dest) < 1 ? 1 : 0;
          const previous = resting.get();
          resting.set(next);
          isDragging.set(false);
          settle(
            translateY,
            reduceMotionSv,
            dest,
            velocity,
            Math.abs(velocity) > FLICK_VELOCITY,
            (finished) => {
              if (finished && resting.get() === 2) {
                dismissed.set(1);
                scheduleOnRN(markClosed);
              }
            },
          );
          if (previous !== next) {
            scheduleOnRN(emitSnap, next === 1 ? 'full' : next === 2 ? 'closed' : 'half');
          }
        })
        .onFinalize(() => {
          isDragging.set(false);
        }),
    [
      band,
      dismissed,
      dragOrigin,
      emitSnap,
      halfY,
      isDragging,
      markClosed,
      reduceMotionSv,
      resting,
      topInsetSv,
      translateY,
    ],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const place = useCallback(
    (height: number, topInset: number) => {
      if (height <= 0) return;
      if (height === parentHeight.current && topInset === placedTopInset.current) return;
      parentHeight.current = height;
      placedTopInset.current = topInset;
      topInsetSv.set(topInset);
      halfY.set(halfOffset(height, topInset));
      band.set(height);
      if (!isDragging.get()) {
        translateY.set(offsetFor(resting.get(), height, topInset));
      }
      setReady(true);
    },
    [band, halfY, isDragging, resting, topInsetSv, translateY],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      place(event.nativeEvent.layout.height, insets.top);
    },
    [insets.top, place],
  );

  useEffect(() => {
    place(parentHeight.current, insets.top);
  }, [insets.top, place]);

  const snapTo = useCallback(
    (snap: BottomSheetSnap) => {
      if (lastSnap.current === snap && !isDragging.get()) return;
      const index = snapIndex(snap);
      const dest = offsetFor(index, band.get(), topInsetSv.get());
      resting.set(index);
      isDragging.set(false);
      if (snap !== 'closed') {
        dismissed.set(0);
        setInteractive(true);
      }
      cancelAnimation(translateY);
      translateY.set(
        withTiming(
          dest,
          {
            duration: reduceMotionSv.get() ? REDUCE_MOTION_MS : PRESENT_MS,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          },
          (finished) => {
            if (finished && resting.get() === 2) {
              dismissed.set(1);
              scheduleOnRN(markClosed);
            }
          },
        ),
      );
      emitSnap(snap);
    },
    [
      band,
      dismissed,
      emitSnap,
      isDragging,
      markClosed,
      reduceMotionSv,
      resting,
      topInsetSv,
      translateY,
    ],
  );

  useImperativeHandle(ref, () => ({ snapTo }), [snapTo]);

  // Android back closes the sheet. Listens only while the sheet is up, and lets the press
  // through once a close has started so back is never swallowed by a closing sheet.
  useEffect(() => {
    if (!interactive) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (lastSnap.current === 'closed') return false;
      snapTo('closed');
      return true;
    });
    return () => subscription.remove();
  }, [interactive, snapTo]);

  const onAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (event.nativeEvent.actionName === 'increment') snapTo('full');
      if (event.nativeEvent.actionName === 'decrement') snapTo('half');
    },
    [snapTo],
  );

  return (
    <View className="absolute inset-0" pointerEvents="box-none" onLayout={onLayout}>
      {ready ? (
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityActions={[
              { name: 'increment', label: 'Expand' },
              { name: 'decrement', label: 'Collapse to middle' },
            ]}
            accessibilityHint="Drag up to full height. Drag down to the bottom to close."
            accessibilityLabel="Bottom sheet"
            accessibilityRole="adjustable"
            accessibilityElementsHidden={!interactive}
            className="absolute inset-x-0 bottom-0 rounded-t-[20px] shadow-[0px_-8px_24px_rgba(0,0,0,0.12)]"
            collapsable={false}
            importantForAccessibility={interactive ? 'auto' : 'no-hide-descendants'}
            onAccessibilityAction={onAccessibilityAction}
            pointerEvents={interactive ? 'auto' : 'none'}
            style={[styles.continuousCorners, { top: insets.top }, sheetStyle]}
          >
            <View
              className="flex-1 overflow-hidden rounded-t-[20px]"
              style={[styles.continuousCorners, { backgroundColor: surfaceColor(scheme) }]}
            >
              <View className="min-h-11 items-center justify-center">
                <View
                  className="h-[5px] w-9 rounded-full"
                  style={{ backgroundColor: handleColor(scheme) }}
                />
              </View>
              <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
                {children}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  continuousCorners: { borderCurve: 'continuous' },
});
