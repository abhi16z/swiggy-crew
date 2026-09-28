import { createRef } from 'react';

import type { BottomSheetRef } from '@/components/ui/bottom-sheet';

// The sheets are mounted once in the root layout, above the tabs; the Home buttons drive
// them through these refs so opening one re-renders nothing on the Home screen.
export const filtersSheetRef = createRef<BottomSheetRef>();
export const askCrewSheetRef = createRef<BottomSheetRef>();
