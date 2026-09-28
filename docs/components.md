# Components

This doc contains components and use cases

## BottomSheet

- A bottom sheet which must be used for all modals in the app.
- The body of the bottom sheet model should lazily load and should unmount if it is a huge component. If it is a light component then there There is no need to unmount the body on close of the bottom sheet. refer to `src\components\showcase\index.tsx` for details.
- To unmount a heavy body on close, clear it from `onClosed` (fires after the close animation), not from `onSnapChange('closed')` (fires as it starts). Refer to `src/components/home-actions/ask-crew-sheet/index.tsx`.
- Sheets that must cover the native tab bar are mounted in the root layout after `AppTabs` and opened through shared refs. Refer to `src/components/home-actions/sheets.tsx` and `sheet-refs.ts`.
- The Android back button closes an open sheet; no per-sheet wiring is needed.
- At half height the sheet is its full height slid down, so the bottom of the body is below the screen. To keep something (like a chat input) on the visible bottom edge at every height, render it in `BottomSheetFooter` as the body's last child; it counter-translates on the UI thread and paints the sheet surface. Content above the footer can end at the footer with `useBottomSheetPeekInset()` (a bottom margin while the sheet is not at full). Refer to `src/components/home-actions/ask-crew-sheet/ask-crew-sheet-body.tsx`.

## Keyboard

- `KeyboardProvider` from `react-native-keyboard-controller` wraps the app in the root layout. Use its `KeyboardStickyView` / `KeyboardChatScrollView` for inputs that follow the keyboard; they animate on the UI thread. Reanimated's `useAnimatedKeyboard` is deprecated.

## TabBarSafeArea

- Wrap floating content in a tab screen (like the Home buttons) so it stays above the native tab bar. Pads by the tab bar inset on iOS; a plain overlay on Android, where screens already end above the tab bar.
