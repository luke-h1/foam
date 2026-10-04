# React Doctor overrides

Config: `doctor.config.json`. CI: `.github/workflows/react-doctor.yml`. Local: `bun run ci:local doctor`.

Each override below was checked against the code before it was added. None turns a rule off for the whole project unless its section says so. Read the entry before you add, remove or widen an override, and check the code again before you extend one to another file.

## Package.json dependency rules

`deslop/unused-dependency` and `deslop/unused-dev-dependency` are off for `package.json`. They only follow static JS imports, so they report every package that the app loads in another way. Before you remove a dependency that react-doctor or `bun why` reports as unused, check these channels:

- Config plugins: `@rnrepo/expo-config-plugin` is a string in the `app.config.ts` `plugins` array.
- Font assets: the `expo-font` config plugin names `@expo-google-fonts/source-code-pro` by file path. No module imports it.
- Devtools that Rozenite finds by itself: `@rozenite/expo-atlas-plugin` and `@rozenite/react-navigation-plugin`. Rozenite loads installed plugin packages without a JS import.

Because the rule is off, nothing reports a dependency that is really unused. Check by hand when you add or remove one.

## Unused-export and unused-file

`deslop/unused-export` and `deslop/unused-file` are off for the whole project. Both follow static imports only.

This codebase imports almost everything through the `@app/*` path alias. Deslop cannot resolve that alias, so it reports an export or file as dead when its only importer uses `@app/...` instead of `./...`. It also cannot follow platform variants: every real caller of `foo.tsx` can resolve to the `.ios.tsx`, `.web.tsx` or `.android.tsx` file instead.

Several triage passes in 2026 gave 40 to 60 or more false positives per full scan and only a few real dead exports each time. A per-file allowlist of that size is not practical.

Because both rules are off, nothing reports dead exports or files. In a cleanup pass, grep the whole project for each candidate symbol or file before you delete it, and before you turn either rule back on.

## useNativeState immutability

`react-hooks-js/immutability` is off for `blocked-terms-screen.tsx` and `saved-phrases-screen.tsx`. Their iOS branches bind `@expo/ui/swift-ui` `useNativeState` values to SwiftUI text fields. `state.value = ...` is the write path that API documents. The rule reads those writes as a mutation of an immutable hook value. Scope any new exemption to the specific files in the same way. Do not turn the rule off for the whole project.

## File-scoped overrides

- **`use-seven-tv-ws.ts`: `react-hooks-js/purity` and `react-doctor/effect-needs-cleanup`.** The purity hits are `Date.now()` calls inside WebSocket callbacks (`onOpen`, `handleMessage` and the resume-ack branch). A socket message must carry the wall-clock time, and the calls run when an event arrives, not during render. The cleanup hit is the heartbeat watchdog `setInterval`. Its handle is stored on the session object. `session.reset()` clears it from all three teardown paths: `onClose`, leaving the chat screen, and the unmount callback. The rule cannot follow that from the effect.
- **`use-websocket.ts`: `react-doctor/effect-needs-cleanup`.** The connect effect opens the `WebSocket` inside a local `start()` so that a reconnect can open it again. The effect returns a cleanup that calls `removeListeners()`, the teardown function that `attachListeners` returned. That function closes the socket and clears the reconnect timer. The rule looks for `socket.close()` in the effect body and cannot follow the close through the returned function.
- **`twitch-chat-service.ts`: `react-hooks-js/purity`.** This module exports the `useTwitchChat` hook, although the file name says "service". The two `Date.now()` hits set `lastActivityAtRef.current`: one in the `reconnect` IRC route handler, one at the top of the WebSocket `onMessage` callback (`handleMessage`). Both record when an inbound line arrived. Both run only when `routeIrcMessage` or the socket dispatch calls them, never while the hook renders. This is the same case as the `use-seven-tv-ws.ts` entry.
- **`twitch-chat-service.ts`: `react-hooks-js/refs`.** The code calls `createChatMessageRouteHandlers` and `createChannelStateRouteHandlers` while it builds the handler table, and passes them ref objects (`optionsRef`, `joinedChannelsRef`, `pendingMessageRef`). Nothing reads `.current` at that time. Every read happens when an IRC line arrives and its handler runs. This is the same case as the `use-chat-messages.ts` entry below.
- **`use-player-bridge.ts` and `use-chat-messages.ts`: `react-hooks-js/refs`.** In `usePlayerBridge`, the code sets `playerMountedAtRef` again on every player generation change. It is a mutable ref and cannot become `useState`. In `useChatMessages`, a `useState` initializer holds the controller. The callbacks passed to it read `optionsRef.current`, so each one uses the options from the latest render. That is the purpose of the adapter, and the reads run at ingest time, not during render.
- **`emote-action-sheet.tsx`: `react-hooks-js/refs`.** The only `.current` read is `sheetRef.current?.requestClose()` inside the `requestClose` callback. That callback runs only from a `Button` `onPress` or from another callback, never during render. The compiler flags the whole `actions` array literal because it uses `requestClose` and the component builds it again on every render. That is a missed-memoization diagnostic, not a ref read during render.
- **`use-live-stream-orientation.ts`: `react-hooks-js/set-state-in-effect`.** `useWindowDimsAreStuck` waits before it reports a disagreement between the window dimensions and the native orientation event. The flag must clear as soon as the two agree again, and that is a `setState` in the effect. A derived value was tried and is wrong. With nothing to clear it, an old "stuck" value matches the window value of the next rotation, which is also late, and the 350ms wait does not happen. That causes the one-frame rotation flicker that the wait prevents.
- **`use-stream-player-source.ts`: `react-hooks-js/refs`.** The `webViewSource` memo reads `resumeTimeRef.current` on purpose. The URL must carry the last known VOD offset when the source is built again, and a remount (`webViewKey`) is what builds it again. If the offset were a reactive dependency, the URL would change on every progress tick and the WebView would reload. The memo prevents that. The deps array has an `exhaustive-deps` disable for the same reason.
- **`use-lazy-ref.ts`: `react-doctor/no-ref-current-in-render`.** This hook is the null-guarded lazy-init pattern that the rule's own help text lists as supported (`if (ref.current === null) ref.current = initializer()`). The linter still flags the assignment. Every consumer (`useSeventvWs`, `useChatSession`, `RouterEffects`, `usePlayerBridge`, `twitch-chat-service`) calls it to set a ref once per mount. None runs the initializer again on a later render.
- **`twitch-ws-service.ts`: `async-await-in-loop` and `js-set-map-lookups`.** The sequential `await` in `cleanupSubscriptions` is intentional. A `Promise.all` version let a sibling reach `teardownIfIdle` while a delete was in progress, and the same id was deleted twice. The comment above the loop records this. The lookup hits are `includes` and `indexOf` over `entry.callbacks`. That array has one entry per subscribed component, usually one to three, and dispatch walks it in order. A Set would be slower and would lose the order.
- **`format-view-count.ts`: `js-hoist-intl`.** The code builds the formatter once and caches it in a module-level binding. It is lazy because building ICU formatters at module scope ran on the boot path through `LiveStreamCard`. Moving it to module scope, as the rule suggests, would undo that.
- **`synced-emotes-screen.tsx`: `rn-no-scrollview-mapped-list`.** This dev-tools screen mounts a fixed, small number of copies of one emote to check the shared animation clock. A virtualized list would unmount the copies that the screen compares.
- **`image-benchmark-screen.tsx`: `no-set-state-after-await-in-effect`.** The auto-start effect awaits `runAll`. Its 90-second decode passes (`runPasses`) make many `setState` calls after an `await`. A component-level `unmountedRef`, set in a separate unmount effect, guards every one of those calls. `runAll` and `runPasses` check it directly after each `await`. That covers more than the local `ignore` flag the rule suggests, which only guards the effect's own continuation. The rule only recognizes a flag that is declared and checked inside the same effect, so it cannot see this guard and keeps flagging the effect.
