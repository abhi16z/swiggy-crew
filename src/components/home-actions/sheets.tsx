import { AskCrewSheet } from './ask-crew-sheet/ask-crew-sheet';
import { FiltersSheet } from './filters-sheet/filters-sheet';
import { askCrewSheetRef, filtersSheetRef } from './sheet-refs';

// Mounted in the root layout after the tabs, so the sheets cover the native tab bar
// instead of sliding behind it.
export function HomeSheets() {
  return (
    <>
      <FiltersSheet ref={filtersSheetRef} />
      <AskCrewSheet ref={askCrewSheetRef} />
    </>
  );
}
