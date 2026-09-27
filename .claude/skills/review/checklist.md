# Review checklist

Performance stays the first review gate. This app is an Expo SDK 57 / React Native 0.86 app aimed at low-end Android, and the existing bottom sheet already shows the bar: UI-thread gestures, deferred heavy content, and no work until layout is measured. Everything else in a pull request is reviewed against that same constraint.

## 1. Performance

Ask whether the change adds work on every frame, every render, or every tab visit.

- **Gestures and animation stay on the UI thread.** Drag math, snap offsets, and springs belong in worklets (`'worklet'` on `utils.ts`, `useSharedValue`, `useAnimatedStyle`). Crossing back to JavaScript is only for side effects, through `scheduleOnRN`, the way snap changes and close cleanup already work.
- **Do not rebuild the gesture or the animated style on unrelated renders.** The sheet keeps `onSnapChange` in a ref and memoizes the pan gesture. A new inline callback or a dependency that changes every render recreates the gesture and drops frames.
- **Heavy sheet bodies load late and go away when closed.** `docs/components.md` is the rule: every modal is `BottomSheet`. A large body is `React.lazy` and stays unmounted until the sheet leaves `closed`, as `ShowcaseSheet` does. A small body can stay mounted.
- **Skip work that the screen does not need yet.** The sheet renders nothing until the parent has a real height, and it ignores a layout event when height and top inset have not changed. New screens should follow that: measure once, then stop.
- **Closed UI must not steal touches or accessibility focus.** When the sheet is closed it sets `pointerEvents="none"` and hides itself from assistive tech, so the screen behind stays usable.
- **Lists, images, and navigation stay cheap.** Prefer `FlashList`-style virtualization if a list appears, fixed image sizes, and no anonymous components inside `renderItem`. Tab screens should not mount expensive trees for tabs the user has not opened.
- **Respect reduced motion.** Springs become a short timing animation when `useReducedMotion()` is on. New motion needs the same branch.
- **Platform splits stay platform splits.** iOS and Android use native tabs (`app-tabs.tsx`). Web has its own file (`app-tabs.web.tsx`). Haptics already skip web via `process.env.EXPO_OS`. A shared component that pulls in a native-only module will break web and bloat the other platforms.

## 2. Where the code lives

- UI, hooks, utils, constants, and types stay under `src/`. Reusable pieces go in `src/components/ui`.
- A file past 300 lines, or a second component in the same file, gets split. ESLint enforces `max-lines` (300) and `react/no-multi-comp`. The bottom sheet is the pattern: `index.tsx`, `utils.ts`, `types.ts`, `constants.ts`.
- Lines stay at 100 characters. Fix a long line by restructuring it. An `eslint-disable` comment is a review failure.
- Styling is NativeWind `className`, including dark mode (`dark:`). `StyleSheet` is only for what NativeWind cannot express, such as `borderCurve: 'continuous'`.
- Dependencies are added with `npx expo install`, including dev dependencies (`npx expo install <pkg> -- -D`). `npm install` and `pnpm install <pkg>` are not how this repo adds packages.

## 3. Types and correctness

- `strict` TypeScript is on. New code uses real types. `any`, `@ts-ignore`, and `@ts-expect-error` need a one-line comment, and only for a third-party type bug.
- Public component APIs are explicit, like `BottomSheetSnap`, `BottomSheetRef`, and `BottomSheetProps`. Callers should not reach into internal shared values.
- Safe area comes from `react-native-safe-area-context`, with `initialWindowMetrics` at the root so the first frame is not wrong.
- Expo, EAS, and React Native APIs are checked against the SDK 57 docs (`https://docs.expo.dev/versions/v57.0.0/`). Training-data APIs are often renamed or gone.

## 4. Accessibility and touch targets

The sheet and showcase already set the standard:

- `accessibilityRole`, `accessibilityLabel`, and a hint when the control is not obvious.
- Touch targets are at least 44pt (`min-h-11`).
- Adjustable controls expose increment and decrement actions, as the sheet does for expand and collapse.
- Text and surfaces have a dark-mode pair. System colors are used on iOS and Android (`surfaceColor`, `handleColor`); web falls back to explicit hex values.

## 5. Tests

- Tests sit next to the file: `bottom-sheet.test.tsx` beside `index.tsx`, `utils.test.ts` beside `utils.ts`. Routes under `src/app/` are not covered.
- Cover the flow and the edge, not line count: first layout, snap changes, flick velocity, reduced motion, closed state, lazy mount.
- React Native Testing Library v14 calls (`render`, `fireEvent`) are async and awaited. Native modules are mocked (`jest.mock('expo-haptics')` or `jest.setup.ts`).
- A bug fix includes a test that fails before the fix.

## 6. What must pass before merge

- `pnpm lint`
- `pnpm format:check`
- `pnpm exec tsc --noEmit`
- `pnpm exec jest --ci`
