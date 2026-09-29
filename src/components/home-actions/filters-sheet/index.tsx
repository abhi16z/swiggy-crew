import { useTripsStore } from '@/components/discover-feed/store';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { BottomSheetRef, BottomSheetSnap } from '@/components/ui/bottom-sheet/types';
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
    if (snap !== 'closed') {
      setContentMounted(true);
      // Pulled back up before it finished closing: the user is still choosing.
      useTripsStore.getState().queueFilters(null);
    }
    setFullHeight(snap === 'full');
  }, []);

  // Runs after the close animation, so neither the feed rebuilding with the chosen filters
  // nor the body remounting ever costs a frame of it. The new key drops unapplied choices.
  const [bodyKey, setBodyKey] = useState(0);
  const handleClosed = useCallback(() => {
    useTripsStore.getState().applyPendingFilters();
    setBodyKey((key) => key + 1);
  }, []);

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
