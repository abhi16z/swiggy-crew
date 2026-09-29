# Performance

## p95 methodology

- Reanimated `useFrameCallback(worklet)` runs a worklet every vsync on the UI thread; `frameInfo.timeSincePreviousFrame` is the frame time in ms
- Timestamps come from `Choreographer` (Android) / `CADisplayLink` (iOS), so deltas are vsync-quantized: 16.7 / 33.3 / 50 ms. A delta tells exactly how many vsyncs were missed
- This keeps ticking while JS is frozen. A JS-driven tracker freezes exactly when you need it most
- Every time the UI produces a frame, we get a callback. we keep timestamps for callbacks from only the last 1 second. 60 callbacks → ~60 FPS. 52 callbacks → ~52 FPS.
- Recalculate the number shown on screen every 500 ms.
- Measure the time between callbacks. 16ms, 17ms, 16ms, 42ms, 16ms... 42ms is a jank.
- If a time is more than 22.2ms, we count that towards drop.
- For JS thread, we can use `requestAnimationFrame`. We note down time for every callback with `Date.now()`
- If time between 2 threads is greater than 100 ms : js thread is busy

## Trade off

- When filter was implemented, I tried to use the default `windowSize` for `FlatList`. But it was creating a significant lag in applying filter and rendering list as it was rendering 21 items. Reduced window size to 5. This fixed the issue but on fast scroll, the list shows white screen sometimes. However between lag and white screen on "fast scroll", optimizing for lag felt usual choice.
- The feed now uses FlashList v2 instead of `FlatList`, so the `windowSize` trade-off above no longer applies: FlashList keeps only about a screen of cards built and recycles them as they scroll off. Filter lag and fast-scroll blanking still need re-measuring on the low-end device.

- We later replaced FlatList with 'FlashList` to minimize white screen> But we used FlatList for chat because there are going to be only few items in the list and Chat is already used as new item on the bottom hence scrolling is not always important flow.

## Tradeoffs

- Replace `FlatList` with `FlashList` - Although we did not see much gain in frame drop but significant improvement over white areas and continuous scrolling. used frame drop from previous run as baseline.
- `drawDistance` default 250px. Not rendering cards which are away from viewport. Trying to add `drawDistance` dropped frame. The white screen while scrolling is minimal. Adding this improved the

## P50 and P95

- both are around 16.6 ms because most of the frames are better than worst frames in a 1000 frame window.
- there is no frame drop in opening closing the bottom sheet
