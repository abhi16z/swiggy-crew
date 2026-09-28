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

import { AskCrewSheetFallback } from './ask-crew-sheet-fallback';

const AskCrewSheetBody = lazy(() => import('./ask-crew-sheet-body'));

// Heavy body: loaded on open and unmounted once the close animation finishes.
export const AskCrewSheet = forwardRef<BottomSheetRef>(function AskCrewSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [contentMounted, setContentMounted] = useState(false);

  const snapTo = useCallback((snap: BottomSheetSnap) => {
    sheetRef.current?.snapTo(snap);
  }, []);

  useImperativeHandle(ref, () => ({ snapTo }), [snapTo]);

  const handleSnapChange = useCallback((snap: BottomSheetSnap) => {
    if (snap !== 'closed') setContentMounted(true);
  }, []);

  const handleClosed = useCallback(() => {
    setContentMounted(false);
  }, []);

  return (
    <BottomSheet
      ref={sheetRef}
      initialSnap="closed"
      onSnapChange={handleSnapChange}
      onClosed={handleClosed}
    >
      {contentMounted ? (
        <Suspense fallback={<AskCrewSheetFallback />}>
          <AskCrewSheetBody onSnapTo={snapTo} />
        </Suspense>
      ) : null}
    </BottomSheet>
  );
});
