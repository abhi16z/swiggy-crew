import { BottomSheet } from '@/components/ui/bottom-sheet/bottom-sheet';
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

import { ShowcaseSheetFallback } from './sheet-fallback';

const ShowcaseSheetBody = lazy(() => import('./sheet-body'));

type ShowcaseSheetProps = {
  onSnapChange?: (snap: BottomSheetSnap) => void;
};

export const ShowcaseSheet = forwardRef<BottomSheetRef, ShowcaseSheetProps>(function ShowcaseSheet(
  { onSnapChange },
  ref,
) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [contentMounted, setContentMounted] = useState(false);

  const snapTo = useCallback((snap: BottomSheetSnap) => {
    sheetRef.current?.snapTo(snap);
  }, []);

  useImperativeHandle(ref, () => ({ snapTo }), [snapTo]);

  const handleSnapChange = useCallback(
    (snap: BottomSheetSnap) => {
      if (snap !== 'closed') setContentMounted(true);
      onSnapChange?.(snap);
    },
    [onSnapChange],
  );

  return (
    <BottomSheet ref={sheetRef} initialSnap="closed" onSnapChange={handleSnapChange}>
      {contentMounted ? (
        <Suspense fallback={<ShowcaseSheetFallback />}>
          <ShowcaseSheetBody onSnapTo={snapTo} />
        </Suspense>
      ) : null}
    </BottomSheet>
  );
});
