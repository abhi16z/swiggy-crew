import { createContext, useContext, useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type BottomSheetContextValue = {
  translateY: SharedValue<number>;
  halfY: SharedValue<number>;
  peekInset: number;
};

export const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheetContextValue(
  translateY: SharedValue<number>,
  halfY: SharedValue<number>,
  peekInset: number,
) {
  return useMemo(() => ({ translateY, halfY, peekInset }), [translateY, halfY, peekInset]);
}

export function useBottomSheetContext(caller: string) {
  const value = useContext(BottomSheetContext);
  if (!value) throw new Error(`${caller} must be rendered inside a BottomSheet`);
  return value;
}

/**
 * How far the bottom of the sheet sits below the screen at half height. Content pinned with
 * `BottomSheetFooter` covers this much of the body's bottom while the sheet is at half, so a
 * list above the footer can inset itself by this amount. Updates only when the sheet is re-laid
 * out, never per frame.
 */
export function useBottomSheetPeekInset() {
  return useBottomSheetContext('useBottomSheetPeekInset').peekInset;
}
