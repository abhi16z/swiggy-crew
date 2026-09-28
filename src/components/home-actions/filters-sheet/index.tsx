import {
  BottomSheet,
  type BottomSheetRef,
  type BottomSheetSnap,
} from '@/components/ui/bottom-sheet';
import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { FiltersSheetFallback } from './filters-sheet-fallback';

const FiltersSheetBody = lazy(() => import('./filters-sheet-body'));

// Light body: loaded on first open and kept mounted afterwards.
export const FiltersSheet = forwardRef<BottomSheetRef>(function FiltersSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [contentMounted, setContentMounted] = useState(false);

  const snapTo = useCallback((snap: BottomSheetSnap) => {
    sheetRef.current?.snapTo(snap);
  }, []);

  useImperativeHandle(ref, () => ({ snapTo }), [snapTo]);

  // The body sizes its scroll area to the part of the sheet on screen, so it needs to know
  // whether the sheet is at full height. Changes once per snap, never per frame.
  const [fullHeight, setFullHeight] = useState(false);

  const handleSnapChange = useCallback((snap: BottomSheetSnap) => {
    if (snap !== 'closed') setContentMounted(true);
    setFullHeight(snap === 'full');
  }, []);

  // A new key after each close remounts the body, dropping a choice that was not applied.
  // It runs after the close animation, so the remount never costs a visible frame.
  const [bodyKey, setBodyKey] = useState(0);
  const handleClosed = useCallback(() => setBodyKey((key) => key + 1), []);

  return (
    <BottomSheet
      ref={sheetRef}
      initialSnap="closed"
      onSnapChange={handleSnapChange}
      onClosed={handleClosed}
    >
      {contentMounted ? (
        <Suspense fallback={<FiltersSheetFallback />}>
          <FiltersSheetBody key={bodyKey} onSnapTo={snapTo} fullHeight={fullHeight} />
        </Suspense>
      ) : null}
    </BottomSheet>
  );
});
