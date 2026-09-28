# Components

This doc contains components and use cases

## BottomSheet

- A bottom sheet which must be used for all modals in the app.
- The body of the bottom sheet model should lazily load and should unmount if it is a huge component. If it is a light component then there There is no need to unmount the body on close of the bottom sheet. refer to `src\components\showcase\index.tsx` for details.
- To unmount a heavy body on close, clear it from `onClosed` (fires after the close animation), not from `onSnapChange('closed')` (fires as it starts). Refer to `src/components/home-actions/ask-crew-sheet/index.tsx`.
- Sheets that must cover the native tab bar are mounted in the root layout after `AppTabs` and opened through shared refs. Refer to `src/components/home-actions/sheets.tsx` and `sheet-refs.ts`.
- The Android back button closes an open sheet; no per-sheet wiring is needed.

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

## PerformancePanel

- Mounted once in the root layout, above every tab and sheet; switched on from Settings and remembered across launches. Opens collapsed: the same card showing only its top row of tiles (UI FPS, drops, JS thread), with no header; tap it to expand to the full card (design 08).
- Frames are sampled on the UI thread with Reanimated's `useFrameCallback`, so scroll and sheet jank is measured on the thread that renders it; the readout is labelled "UI FPS" for that reason. A drop is a frame slower than 1000/45 ms; the sparkline and chart also mark "slow" frames between 16.7 and 22.2 ms.
- Frame times are vsync timestamps, so on a 60 Hz screen a frame is 16.7 ms or a multiple of it. One missed vsync is a 33.3 ms frame (30 FPS) and counts as a drop, even though the 1-second FPS only dips to 59.
- The compact readouts are `TextInput`s driven by shared values (`readout.tsx`). React never re-renders them and they keep moving while the JS thread is blocked. The JS indicator is a heartbeat: a JS `requestAnimationFrame` loop stamps a shared value every few frames, and the UI thread reports "blocked" when the stamp is older than 100 ms. Blocks of 50 ms or more are reported after the fact too.
- Everything redraws 4 times a second. While expanded, one snapshot per redraw is sent to React through a store that only the expanded card subscribes to; the frame-time chart is the one cost worth knowing about (120 bars).
- Session p50/p95 come from a 0.1 ms histogram, so memory stays flat however long the session runs. Reset clears the session; Copy report puts a text summary on the clipboard (`expo-clipboard`).
- The first frame after the app returns to the foreground is discarded; it spans the background gap, not a frame.

## RemoteImage

- Use for every remote image. Built on `expo-image` (disk and memory cache, downscaled to the view size on Android).
- `width` and `height` are required so the layout never waits on the image. Remote images are 16:9 and cropped to cover the box. Card hero sizes from the designs are in `src/components/ui/remote-image/constants.ts`.
- While loading: the item's `placeholderColor`, then `loaderUri` (a tiny remote copy in the same aspect ratio, e.g. ImageKit `?tr=w-45,h-25`) scaled up to fill the box. Without `loaderUri` it falls back to `src/assets/image-loading.png`. Both are drawn natively, so a successful load re-renders nothing.
- `loaderUri` must be a remote http(s) URL: the `RemoteUri` type rejects other values, and in development a bundled image (`require(...)`, typed `any`) throws.
- On failure: `src/assets/image-placeholder.png` centered on a neutral background, in the same box.
- Safe in recycled list cells: a new `uri` resets the failure state and the previous image. Refer to `src/components/showcase/image-showcase.tsx`.
