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

  const handleSnapChange = useCallback((snap: BottomSheetSnap) => {
    if (snap !== 'closed') setContentMounted(true);
  }, []);

  return (
    <BottomSheet ref={sheetRef} initialSnap="closed" onSnapChange={handleSnapChange}>
      {contentMounted ? (
        <Suspense fallback={<FiltersSheetFallback />}>
          <FiltersSheetBody onSnapTo={snapTo} />
        </Suspense>
      ) : null}
    </BottomSheet>
  );
});
