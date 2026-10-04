# React Doctor overrides

Config: `doctor.config.json`. CI: `.github/workflows/react-doctor.yml`. Local: `bun run ci:local doctor`.

Each override below was checked against the code before it was added. Read its entry before you add, remove or widen an override.

## package.json dependency rules

`deslop/unused-dependency` and `deslop/unused-dev-dependency` are turned off for `package.json` in `doctor.config.json`. They only follow static JS imports, so they false-positive on every package this app loads through a channel they can't scan. Do not remove a dependency just because react-doctor (or a quick `bun why`) reports it unused — check these channels first:

- **Config plugins** — `@rnrepo/expo-config-plugin` (string in the `app.config.ts` `plugins` array).
- **Font assets** — `@expo-google-fonts/source-code-pro` (referenced by file path in the `expo-font` config plugin, never imported).
- **Auto-discovered devtools** — `@rozenite/expo-atlas-plugin`, `@rozenite/react-navigation-plugin` (Rozenite loads installed plugin packages without a JS import).

Because the rule is off for `package.json`, a genuinely unused dependency won't be flagged automatically — verify by hand when adding or removing deps.

## unused-export / unused-file are off project-wide

`deslop/unused-export` and `deslop/unused-file` are turned off globally in `doctor.config.json`. Both walk static imports only, and this codebase imports almost everything through the `@app/*` tsconfig path alias rather than relative paths - deslop cannot resolve that alias, so it flags the export or file as dead the moment its only importer uses `@app/...` instead of `./...`. It also cannot follow platform-variant resolution (`Foo.tsx` importing what looks unused because every real caller resolves to the `.ios.tsx`/`.web.tsx`/`.android.tsx` sibling instead). Across several 2026 triage passes this consistently produced 40-60+ false positives per full scan and only ever turned up a handful of genuinely dead exports each time - not a workable per-file allowlist at this codebase's size.

Because both rules are off, genuinely dead exports and files won't be flagged automatically - when doing a react-doctor cleanup pass, verify each `unused-export`/`unused-file`-shaped candidate by hand with a project-wide grep for the symbol/file before deleting anything, and before re-enabling either rule.

## useNativeState immutability override

`react-hooks-js/immutability` is turned off for `blocked-terms-screen.tsx` and `saved-phrases-screen.tsx` in `doctor.config.json`. Their iOS branches bind `@expo/ui/swift-ui` `useNativeState` values to SwiftUI text fields, and writing back through `state.value = ...` is that API's intended write path - the rule misreads those writes as mutation of an immutable hook value. Scope any future exemption to the specific files the same way rather than turning the rule off globally.

## the remaining file-scoped overrides

Each of these was checked against the code before being suppressed; none is a blanket rule-off. Re-verify before extending one to another file.

- **`use-seven-tv-ws.ts` - `react-hooks-js/purity` and `react-doctor/effect-needs-cleanup`.** The purity hits are `Date.now()` inside WebSocket callbacks (`onOpen`, `handleMessage`, the resume-ack branch); a socket message has to be stamped with the wall clock, and the calls run at event time, not during render. The cleanup hit is the heartbeat watchdog `setInterval`, whose handle is stored on the session object and cleared by `session.reset()` from all three teardown paths - `onClose`, leaving the chat screen, and the unmount callback - which the rule cannot follow off the effect.
- **`use-websocket.ts` - `react-doctor/effect-needs-cleanup`.** The connect effect opens the `WebSocket` inside a local `start()` so a reconnect can reopen it, and returns a cleanup that calls `removeListeners()`, the teardown `attachListeners` returned, which closes the socket and clears the reconnect timer. The rule wants to see `socket.close()` in the effect body itself and cannot follow the close through that returned function.
- **`twitch-chat-service.ts` - `react-hooks-js/purity`.** Despite the filename, this module exports the `useTwitchChat` hook. The two `Date.now()` hits are `lastActivityAtRef.current = Date.now()` in the `reconnect` IRC route handler and at the top of the WebSocket `onMessage` callback (`handleMessage`) - both stamp when an inbound line actually arrived, and both only run when `routeIrcMessage`/the socket dispatch invoke them, never while the hook itself is rendering. Same shape as the `use-seven-tv-ws.ts` entry above.
- **`twitch-chat-service.ts` - `react-hooks-js/refs`.** `createChatMessageRouteHandlers` and `createChannelStateRouteHandlers` are called while the handler table is built, and are handed ref _objects_ (`optionsRef`, `joinedChannelsRef`, `pendingMessageRef`). Nothing reads `.current` at that point - every read happens when an IRC line arrives and the matching handler runs. Same shape as the `use-chat-messages.ts` entry below, and the file is already exempt from `react-hooks-js/purity` for the same reason.
- **`use-player-bridge.ts` and `use-chat-messages.ts` - `react-hooks-js/refs`.** In `usePlayerBridge`, `playerMountedAtRef` is re-stamped on every player generation change, so it is a genuinely mutable ref and cannot become `useState`. In `useChatMessages`, the controller itself is held in a `useState` initializer, but the callbacks handed to it read `optionsRef.current` so each one resolves against the latest render's options - that indirection is the adapter's whole job, and the reads run at ingest time rather than during render.
- **`emote-action-sheet.tsx` - `react-hooks-js/refs`.** The only `.current` read in the file is `sheetRef.current?.requestClose()` inside the `requestClose` callback, which only runs from a `Button`'s `onPress` or another callback - never during render. The compiler still flags the whole `actions` array literal (it closes over `requestClose`) because the array itself is rebuilt inline every render instead of being memoized; that's a missed-memoization diagnostic, not an actual render-phase ref read.
- **`use-live-stream-orientation.ts` - `react-hooks-js/set-state-in-effect`.** `useWindowDimsAreStuck` debounces the disagreement between the window dimensions and the native orientation event. The flag has to clear the moment the two agree again, which is a `setState` in the effect. Deriving it instead was tried and is wrong: with nothing to clear, a remembered "stuck" value matches the _next_ rotation's lagging window value and the 350ms wait is skipped entirely, which is the one-frame rotation flicker the debounce exists to prevent.
- **`use-stream-player-source.ts` - `react-hooks-js/refs`.** The
  `resumeTimeRef.current` read inside the `webViewSource` memo is the point of
  that memo. The URL has to carry the last known VOD offset at the moment the
  source is rebuilt, and a remount (`webViewKey`) is what rebuilds it. Making
  the offset a reactive dependency would rebuild the URL on every progress tick
  and reload the WebView, which is the bug the memo prevents. The deps array
  already carries an `exhaustive-deps` disable for the same reason.
- **`use-lazy-ref.ts` - `react-doctor/no-ref-current-in-render`.** This hook is the textbook null-guarded lazy-init pattern the rule's own help text calls out as supported (`if (ref.current === null) ref.current = initializer()`), but the linter still flags the assignment line. Every consumer (`useSeventvWs`, `useChatSession`, `RouterEffects`, `usePlayerBridge`, `twitch-chat-service`) only calls it to seed a ref once per mount - none re-runs the initializer or relies on re-init behavior on a later render.
- **`twitch-ws-service.ts` - `async-await-in-loop` and `js-set-map-lookups`.** The sequential `await` in `cleanupSubscriptions` is deliberate: a `Promise.all` version let a sibling reach `teardownIfIdle` while a delete was in flight and double-deleted the same id (the comment above the loop records this). The lookup hits are `includes`/`indexOf` over `entry.callbacks`, which holds one entry per subscribed component (typically one to three) and is iterated in order to dispatch - a Set would be slower and would drop the ordering.
- **`format-view-count.ts` - `js-hoist-intl`.** The formatter is already built once and cached in a module-level binding; it is lazy specifically because constructing ICU formatters at module scope sat on the boot path via `LiveStreamCard`. Hoisting it as the rule suggests would undo that.
- **`synced-emotes-screen.tsx` - `rn-no-scrollview-mapped-list`.** A dev-tools screen that mounts a fixed handful of copies of the same emote to check the shared animation clock. Virtualising it would unmount the very copies the screen exists to compare.
- **`image-benchmark-screen.tsx` - `no-set-state-after-await-in-effect`.** The auto-start effect awaits `runAll`, whose 90-second decode passes (`runPasses`) make many post-await `setState` calls of their own. Every one of those is now gated behind a component-level `unmountedRef` set in a dedicated unmount effect, checked immediately after each `await` in both `runAll` and `runPasses` - strictly more coverage than the rule's own suggested local `ignore` flag, which only guards the effect's own outer continuation. The rule's pattern match only recognizes a flag declared and checked inside the same effect, so it can't see a guard that lives inside the called functions and keeps flagging the effect after the real fix lands.
