# Handoff: feature entry points

Three features have stub entry points wired into the app. Each can now be built in its own session, in parallel. This doc says which files each session owns, what must keep working, and what is still undecided.

Read `AGENTS.md` first. Its rules apply to every session: `npx expo install` only, NativeWind first, tests next to files, 300-line limit per component, performance first (low-end Android), and `pnpm lint` + `pnpm format:check` must pass.

Designs are in `local/designs`. The designs are a guideline; where they conflict with the app, the app wins.

## Current state

- Every entry point renders placeholder text only. The wiring works: buttons open sheets, and the Settings switch shows or hides the panel.
- `pnpm test` (51 tests), `pnpm lint`, `pnpm format:check` and `pnpm exec tsc --noEmit` all pass.
- Nothing has been checked on a real device or simulator. In particular, whether the root overlays (sheets, performance panel) draw above the native tab bar on Android and iOS is unconfirmed.
- The entry points are committed (`949c02f`). Ask Crew is built on branch `claude/beautiful-dirac-86t6t2` (see 2b); **its code has not been compiled, linted or tested yet** (see "Ask Crew: finish setup" below).

## Shared infrastructure (no feature session edits these)

Changing any of these affects every feature. Discuss the change first, and keep the tests passing.

| File                                                      | What it does                                                                                                                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/_layout.tsx`                                     | Root. Paint order is `AppTabs` → `HomeSheets` → `PerformancePanel`: sheets cover the tab bar, and the panel covers the sheets.                                                                                                              |
| `src/components/app-tabs.tsx` / `app-tabs.web.tsx`        | Tabs: Home, Showcase, About, Settings (native tabs; web uses `expo-router/ui`).                                                                                                                                                             |
| `src/components/ui/bottom-sheet/*`                        | The sheet used for all modals. Snap stops are `'half' \| 'full' \| 'closed'`. `onSnapChange('closed')` fires when closing **starts**; `onClosed` fires once the close animation **finishes**. The Android back button closes an open sheet. |
| `src/components/ui/bottom-sheet/footer.tsx`, `context.ts` | `BottomSheetFooter` keeps content on the visible bottom edge at every height; `useBottomSheetPeekInset()` gives the body height hidden below the screen at half. Added for Ask Crew.                                                        |
| `src/components/ui/tab-bar-safe-area/*`                   | `TabBarSafeArea`: wrap floating content in a tab screen with it. On iOS it pads by the tab bar inset. On Android it's a plain overlay, because the native safe area there pushed the buttons up after a tab switch (regression-tested).     |
| `src/app/_layout.tsx` (again)                             | Also wraps the app in `KeyboardProvider` (`react-native-keyboard-controller`).                                                                                                                                                              |
| `src/lib/open-router/*`, `src/lib/ai-settings/*`          | OpenRouter client (streaming chat, models, key check) and the saved key/model. The key is in SecureStore; the model id in AsyncStorage (`ask-crew-model`).                                                                                  |
| `docs/components.md`                                      | Conventions for the components above.                                                                                                                                                                                                       |

`src/components/showcase/*` is a component gallery only. It isn't part of any feature.

---

## Feature 1: Discover feed

**Designs:** 01 (feed), 02 (loading), 03 (card details open). **Spec:** `local/phase1.md`. **Data:** https://ik.imagekit.io/a16xyz/crew/travel-bundles.json

**Files owned by this session**

| File                                             | Role                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `src/components/discover-feed/discover-feed.tsx` | Entry point. Exports `DiscoverFeed` (no props). Build the feed here and break it into sub-files inside this folder. |

**Mounted by:** `src/app/index.tsx`, which renders `<DiscoverFeed />` then `<HomeActions />`. Don't add state to `HomeScreen`.

**Must keep holding**

- Opening a sheet must not re-render or remount the feed (phase 1 requirement). This holds today because the Home screen holds no state; `home-actions.test.tsx` checks it.
- At least 100 items, at or above 55 FPS during continuous scroll, on low-end Android.
- Remote images need explicit dimensions and a low-fidelity placeholder.
- On iOS the first `ScrollView`/list in a native tab screen gets automatic content inset for the tab bar. Keep the list as the screen's first scroll view.
- Leave bottom space so the last card can scroll clear of the floating buttons.
- The compact performance panel (design 07) overlaps the top of the screen when it's on; that's expected.

---

## Feature 2: Filters and Ask Crew (floating buttons + sheets)

Filters and Ask Crew live in separate folders, so they can be two separate sessions.

**Designs:** 01 and 07 (buttons; design 07 shows the Filters badge), 10 (Filters sheet), 04 to 06 (Ask Crew: half, full + waiting, streaming + keyboard), 09 (chat with panel and feed).

**How it's wired**

- `HomeActions` (Home screen) renders only the two floating buttons, inside `TabBarSafeArea`.
- The sheets are mounted once at the root by `HomeSheets`, so they cover the native tab bar.
- The buttons open sheets through module-level refs (`sheet-refs.ts`). Opening a sheet re-renders nothing on Home.
- Both sheets close when Home loses focus.

**Shared by both sub-features (edit only your own part)**

| File                                                | Role                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/home-actions/home-actions.tsx`      | `HomeActions`: both floating buttons, plus close-on-blur. Filters owns the Filters button; Ask Crew owns the Ask Crew button. Both live in this one file, so coordinate or split them into separate files first to avoid merge conflicts. |
| `src/components/home-actions/sheets.tsx`            | `HomeSheets`: mounts both sheets with their refs. Rarely needs changes.                                                                                                                                                                   |
| `src/components/home-actions/sheet-refs.ts`         | `filtersSheetRef`, `askCrewSheetRef`.                                                                                                                                                                                                     |
| `src/components/home-actions/home-actions.test.tsx` | Checks the buttons open sheets, stay in the bottom safe area, don't re-render Home, and close sheets on blur.                                                                                                                             |

### 2a. Filters sheet

| File                                       | Role                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `filters-sheet/filters-sheet.tsx`          | Sheet wrapper. The body loads lazily on first open and **stays mounted** after closing. |
| `filters-sheet/filters-sheet-body.tsx`     | **Build here.** Default export, receives `onSnapTo(snap)`.                              |
| `filters-sheet/filters-sheet-fallback.tsx` | Shown while the body loads.                                                             |
| `filters-sheet/filters-sheet.test.tsx`     | Lazy mount and kept-mounted behaviour.                                                  |

### 2b. Ask Crew sheet (built)

Chat with an OpenRouter model about the destinations in the feed. Replies stream token by token.

| File                                     | Role                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ask-crew-sheet/ask-crew-sheet.tsx`      | Sheet wrapper. Passes the current snap to the body and dismisses the keyboard below full height.                                                                                                  |
| `ask-crew-sheet/ask-crew-sheet-body.tsx` | Layout: header, messages (or empty state / missing-key notice), composer in `BottomSheetFooter`.                                                                                                  |
| `ask-crew-sheet/chat/store.ts`           | Session chat store (in memory, outside the body): all chats of the session, the open chat, the draft; `sendMessage`, `stopReply`, `retryReply`, `startNewChat`, `openChat`.                       |
| `ask-crew-sheet/chat/delta-buffer.ts`    | Batches streamed text to one UI update per 50 ms.                                                                                                                                                 |
| `ask-crew-sheet/chat/system-prompt.ts`   | System prompt; lists the feed's destinations (`destinations.ts` fetches the feed JSON once per session, waits at most 3 s).                                                                       |
| `ask-crew-sheet/components/*`            | Slim header (icon buttons: All chats, new chat, close), chat list, inverted message list on `KeyboardChatScrollView`, bubbles (with the "Thinking…" indicator), composer on `KeyboardStickyView`. |
| `src/components/settings/open-router/*`  | Settings: OpenRouter key (checked with `GET /key` before saving) and the searchable model list (all text chat models, ~390).                                                                      |

Decisions taken:

- Provider: OpenRouter's chat completions API with `stream: true`, read with `expo/fetch` (streams on SDK 57). Default model `anthropic/claude-opus-5`; the user picks another in Settings.
- The key is stored with `expo-secure-store` (Keychain / Keystore). On web it is kept in memory only.
- Chats live for the app session, not across launches. "New chat" keeps the previous chat; "All chats" lists the session's chats (most recently used first) to switch between them. Each chat streams independently, so a reply keeps arriving in its own chat after switching away. Each request sends the last 20 messages of its chat.
- Replies are plain text (the prompt asks for no Markdown), so no Markdown renderer is needed.

**Must keep holding**

- The Ask Crew body unmounts on close; everything that must survive a close lives in `chat/store.ts`. A reply keeps streaming while the sheet is closed.
- The input follows the keyboard only at full height. Touching the input expands the sheet (on touch-down, so the React commit happens before the keyboard event; see the iOS note in "Ask Crew: finish setup").

-------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ask-crew-sheet/ask-crew-sheet.tsx` | Sheet wrapper. The body loads lazily on open and **unmounts after the close animation finishes** (`onClosed`). |
| `ask-crew-sheet/ask-crew-sheet-body.tsx` | **Build here.** Default export, receives `onSnapTo(snap)`. |
| `ask-crew-sheet/ask-crew-sheet-fallback.tsx` | Shown while the body loads. |
| `ask-crew-sheet/ask-crew-sheet.test.tsx` | Lazy mount, unmount after close, reload on reopen. |

**Must keep holding**

- The Ask Crew body unmounts on close, so any chat history or draft that should survive a close must live outside the body (for example a zustand store).
- The sheet body already gets bottom padding for the device safe area. Keyboard handling for the chat input (design 06) is not built yet.

---

## Feature 3: Performance panel and Settings tab

**Designs:** 07 (compact), 08 (expanded), 09 (over chat and feed).

**Files owned by this session**

| File                                                     | Role                                                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/performance-panel/panel.tsx`             | **Build the HUD here.** Default export; loaded lazily the first time the panel is turned on.                                                                         |
| `src/components/performance-panel/performance-panel.tsx` | `PerformancePanel` host: returns `null` when hidden, otherwise an overlay pinned to the top safe area that passes touches through.                                   |
| `src/components/performance-panel/store.ts`              | Zustand store saved to AsyncStorage under the key `performance-panel`. Exports `usePerformancePanelVisible()` and `setPerformancePanelVisible()`. Default is hidden. |
| `src/components/performance-panel/store.test.ts`         | Saving and restoring on launch.                                                                                                                                      |
| `src/components/settings/settings.tsx`                   | Settings screen: a "Settings" heading, then the "Performance panel" switch.                                                                                          |
| `src/components/settings/settings.test.tsx`              | The switch shows and hides the panel.                                                                                                                                |
| `src/app/settings.tsx`                                   | Route; renders `<Settings />`.                                                                                                                                       |

**Must keep holding**

- The panel is mounted once in the root layout and appears over every tab and over open sheets.
- It must not cost noticeable performance itself. The design footer says frames are sampled on the UI thread and the display redraws 4 times a second, so sample on the UI thread and throttle React updates.
- The Settings heading block is about 80pt tall so the switch sits below the compact panel (about 67pt below the top inset in design 07). If the compact panel ends up taller, grow the heading block to match.
- Known: AsyncStorage loads asynchronously, so a panel left on appears a moment after launch.
- Settings also renders the Ask Crew section (`settings/open-router`, owned by 2b) below the switch. Keep it last; its model list grows to fill the rest of the screen.

---

## Open decisions (agree before or during the sessions)

1. **Where applied filters live.** Filters writes them and the feed reads them. Pick the store's location and shape before both sessions start, so neither blocks the other.
2. **Icons.** No icon library is installed; the buttons, badges and sheets in the designs all need icons.
3. **Filters badge count** (design 07): it depends on decision 1.

## Ask Crew: finish setup (not done in the cloud session)

The cloud session that built Ask Crew could not install dependencies (`pnpm install` is denied in `.claude/settings.json`), so nothing below has run yet:

1. `pnpm install --frozen-lockfile`
2. `npx expo install expo-secure-store react-native-keyboard-controller` (SDK 57 versions: `~57.0.4` and `1.21.9`). Both are native modules: rebuild the dev client.
3. Run the four checks below and fix what fails. Prettier will likely reorder some Tailwind classes; run `pnpm format`.
4. On a device, check:
   - Streaming shows text progressively on Android and iOS (`expo/fetch`).
   - At half height the input sits on the screen's bottom edge; at full height it rides the keyboard and the last message stays visible above it.
   - iOS (New Architecture): the keyboard animation is not skipped when the input is tapped at half height. If it is, enable Reanimated's `DISABLE_COMMIT_PAUSING_MECHANISM` flag (see the `KeyboardChatScrollView` troubleshooting docs).
   - `className` / `contentContainerClassName` on `FlatList` are applied by NativeWind.
   - The feed behind the sheet keeps 55+ FPS while the sheet opens and while a reply streams.

## Verify before finishing a session

```bash
pnpm exec tsc --noEmit
```

```bash
pnpm lint
```

```bash
pnpm format:check
```

```bash
pnpm test
```
