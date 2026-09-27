import type { ReactNode } from 'react';

export type BottomSheetSnap = 'half' | 'full' | 'closed';

export type BottomSheetRef = {
  snapTo: (snap: BottomSheetSnap) => void;
};

export type BottomSheetProps = {
  children?: ReactNode;
  initialSnap?: BottomSheetSnap;
  onSnapChange?: (snap: BottomSheetSnap) => void;
};
