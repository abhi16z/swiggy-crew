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

## Accordion

- A titled section that starts collapsed. An optional `summary` sits beside the chevron so the current value reads without expanding (e.g. Sort by · Top rated).
- The content mounts on first expand and then stays mounted; the height animation runs on the UI thread and shortens under reduced motion. Collapsed content takes no touches and is hidden from screen readers.
- Uncontrolled: to reset it to collapsed, remount it. Refer to `src/components/home-actions/filters-sheet/filters-sheet-body.tsx`.

## ScreenSafeArea

- Every tab page wraps its content in it, so nothing draws under the status bar or notch. It pads the top only: the app is portrait, and the bottom belongs to the tab bar.
- It has no background and takes no `className`: put it inside the page's background view and lay out an inner `View`. Refer to `src/components/settings/index.tsx`.
- Keep a page's `BottomSheet` outside it; the sheet already places itself below the top inset.

## TabBarSafeArea

- Wrap floating content in a tab screen (like the Home buttons) so it stays above the native tab bar. Pads by the tab bar inset on iOS; a plain overlay on Android, where screens already end above the tab bar.

## RemoteImage

- Use for every remote image. Built on `expo-image` (disk and memory cache, downscaled to the view size on Android).
- `width` and `height` are required so the layout never waits on the image. Remote images are 16:9 and cropped to cover the box. Card hero sizes from the designs are in `src/components/ui/remote-image/constants.ts`.
- While loading: the item's `placeholderColor`, then `loaderUri` (a tiny remote copy in the same aspect ratio, e.g. ImageKit `?tr=w-45,h-25`) scaled up to fill the box. Without `loaderUri` it falls back to `src/assets/image-loading.png`. Both are drawn natively, so a successful load re-renders nothing.
- `loaderUri` must be a remote http(s) URL: the `RemoteUri` type rejects other values, and in development a bundled image (`require(...)`, typed `any`) throws.
- On failure: `src/assets/image-placeholder.png` centered on a neutral background, in the same box.
- Safe in recycled list cells: a new `uri` resets the failure state and the previous image. Refer to `src/components/showcase/image-showcase.tsx`.
