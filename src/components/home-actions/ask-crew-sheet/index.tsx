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
import { Keyboard } from 'react-native';

import { AskCrewSheetFallback } from './ask-crew-sheet-fallback';

const AskCrewSheetBody = lazy(() => import('./ask-crew-sheet-body'));

// Heavy body: loaded on open and unmounted once the close animation finishes.
export const AskCrewSheet = forwardRef<BottomSheetRef>(function AskCrewSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [contentMounted, setContentMounted] = useState(false);
  const [snap, setSnap] = useState<BottomSheetSnap>('closed');

  const snapTo = useCallback((target: BottomSheetSnap) => {
    sheetRef.current?.snapTo(target);
  }, []);

  useImperativeHandle(ref, () => ({ snapTo }), [snapTo]);

  const handleSnapChange = useCallback((next: BottomSheetSnap) => {
    setSnap(next);
    if (next !== 'closed') setContentMounted(true);
    // The input only follows the keyboard at full height.
    if (next !== 'full') Keyboard.dismiss();
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
          <AskCrewSheetBody snap={snap} onSnapTo={snapTo} />
        </Suspense>
      ) : null}
    </BottomSheet>
  );
});
