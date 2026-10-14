# Test audit - 2026-10-14

The question: which tests would pass even if the code they cover broke? Three
read-only reviews covered chat, screens and components, and hooks, store and
utilities. Together they read every test file. Before I wrote this, I
checked the most important claims against the source.

## Summary

- No test breaks the AGENTS.md rules: there is no `it(`, `objectContaining`
  or `toMatchObject` anywhere.
- The real problem is stubs on the app's own code. About 20 chat files use
  `jest.spyOn` to replace store actions, hooks and pure helpers. Some of those
  tests assert only that a stub was called, so they pass when the real logic
  is broken.
- `jest.mock` is rare: 15 calls in 5 files, nearly all in the auth tests.
- Two root mocks force the auth tests to mock more than they need to.
  `__mocks__/expo-secure-store.ts` is three bare `jest.fn()`s with no storage
  behind them. The root `expo-constants` mock has no auth proxy URL, so
  modules that build that URL at load time throw.

What a test may fake: the network clients (`twitchApi` and the other API
clients), sockets, timers, Sentry, native-only UI that cannot fire events in
Jest (`@expo/ui` `SegmentedControl` and `BottomSheet`, `WebView`), `Alert`,
`Linking` and `imageFileStore`. Everything else should run for real. Assert
the state the user depends on (`chatStore$`, `preferences$`, MMKV, the query
cache), not the calls that produced it.

## Checked

- `redirectSystemPath` returns `path` on every branch, so three of the four
  `native-intent` tests cannot fail.
- `use-emote-reprocessing.test.ts` stubs `resolveMessageEmoteParts` to always
  return an emote token. Its "reprocesses" tests never exercise emote
  matching.
- `chat-preference-screen.test.tsx` replaces the preview with a stub. The
  stub's testIDs (`...-alternatingRows`) differ from the real ones
  (`...-alternating-rows`), so the test checks the stub, not the screen.
- The `expo-secure-store` root mock has no storage, unlike the in-memory MMKV
  mock.
- `live-stream-card-skeleton.test.tsx`, which I added on this branch, copies
  the row height of 101 from the code.

## Ranked worklist

Ranked by how much false confidence the test gives today, over effort.

| #   | Change                                                                                                                                                                                                                                                                                                                                                   | Files                                                                                                                                                                                         | Effort |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Back the root `expo-secure-store` mock with a `Map`, like the MMKV mock. Add the auth proxy URL and Twitch client id to the root `expo-constants` mock's `extra`. Rows 6 and 12 need this.                                                                                                                                                               | `__mocks__/expo-secure-store.ts`, `__mocks__/expo-constants*`                                                                                                                                 | S      |
| 2   | Let the real emote resolver run. Seed the channel emote cache and `chatStore$.messages`, then assert the final tokens.                                                                                                                                                                                                                                   | `use-emote-reprocessing.test.ts`, `message-enrichment.test.ts`                                                                                                                                | M      |
| 3   | Remove 11 internal stubs on the main ingest path. Seed the store caches and assert the real tokens in `chatStore$.messages`.                                                                                                                                                                                                                             | `use-chat-message-processing.test.ts`                                                                                                                                                         | M      |
| 4   | Remove the preview stub. Assert the switch state, `getPreferences()` and one visible change in the real preview.                                                                                                                                                                                                                                         | `chat-preference-screen.test.tsx`                                                                                                                                                             | S      |
| 5   | Remove about 45 stubs from the screen-level chat test. Keep the service, socket and list boundaries. Assert `chatStore$.messages` after the flush.                                                                                                                                                                                                       | `chat.recent-messages.test.tsx`                                                                                                                                                               | L      |
| 6   | Fake `fetch` by URL, not the app's own services. Assert the stored user with `toEqual` and a fixed `Date.now`. Seed and check the real query cache on logout.                                                                                                                                                                                            | `auth-context.test.tsx`                                                                                                                                                                       | M      |
| 7   | Use `AuthContextTestProvider` in place of the `useAuthContext` spy. Remove four hook stubs.                                                                                                                                                                                                                                                              | `router-effects.test.tsx`                                                                                                                                                                     | S      |
| 8   | Seed search history through the real MMKV mock. Replace the debounce spy with fake timers.                                                                                                                                                                                                                                                               | `search-screen.test.tsx`                                                                                                                                                                      | S      |
| 9   | Remove 7 stubs on the row render path and the assertions on internal calls. Assert the real emote parts and mention colour.                                                                                                                                                                                                                              | `use-chat-row-renderer.test.tsx`                                                                                                                                                              | M      |
| 10  | Assert the cosmetics and teardown state, not the calls.                                                                                                                                                                                                                                                                                                  | `create-seven-tv-callbacks.test.ts`, `use-chat-lifecycle.test.ts`                                                                                                                             | M      |
| 11  | Use the in-memory MMKV mock, not storage stubs. Fake 7TV at the service boundary.                                                                                                                                                                                                                                                                        | `cosmetics.test.ts`, `cosmetics-churn.test.ts`, `cosmetics-bridge.test.ts`, `user-cosmetics-fetch.test.ts`                                                                                    | M      |
| 12  | After row 1: drop duplicate root mocks and the logger mock. `use-twitch-sign-in` goes from 6 mocks to 1, `use-populate-auth` from 3 to 0, `token-lifecycle` from 2 to 0.                                                                                                                                                                                 | the three auth hook tests                                                                                                                                                                     | S each |
| 13  | Use `AuthContextTestProvider` in place of `useAuthContext` spies.                                                                                                                                                                                                                                                                                        | `use-channel-activity`, `use-channel-event-sub-subscriptions`, `use-dev-tools-access`, `use-chat-emote-loader`, `use-twitch-channel-points-event-sub`, `twitch-chat-service`                  | S each |
| 14  | Run the player scripts in `node:vm` against a stub page, like the live-sync tests, and assert what they post. Today these tests only check the source text.                                                                                                                                                                                              | `build-twitch-autoplay-ensure-script`, `content-gate-watcher`, `embed-error-watcher`, `latency-tracker`, `player-audio-default`                                                               | M      |
| 15  | Replace the one Legend State reactivity check with tests for `update` and for the untested migrations (`'text'` to `'compact'`, `'auto'` to `'native'`, `chatDelay` 0 to `'auto'`).                                                                                                                                                                      | `preference-store.test.tsx`                                                                                                                                                                   | S-M    |
| 16  | Read the store, not `mock.calls`, in the remaining chat hook tests.                                                                                                                                                                                                                                                                                      | `use-chat-irc-handlers`, `use-chat-messages`, `use-chat-cosmetics`, `use-seven-tv-chat-runtime`, `use-chat-settings-actions`, `use-chat-interaction-handlers`, `resolve-message-emote-tokens` | S each |
| 17  | Smaller spy removals: `onboarding-screen` (real MMKV), `streamer-profile-screen` (`useScrollToTop`), `stream-list-layout-toggle` (`SymbolView`), `stream-player` (safe area), `use-sync-paint-renderer-flag`, `use-remote-config`, `show-action-menu`, `preload-emotes`, `twitch-emote-service`, `use-stream-profile-pictures`, `forward-log-to-sentry`. | as listed                                                                                                                                                                                     | S each |

## Delete

About 55 tests. Each one restates a constant, checks that a prop reaches a
stub unchanged, or repeats another test that asserts more.

**Chat**

- `suppressed-notice-ids.test.ts` (a constant `Set`).
- `chat-notice-accents.test.ts` "wires each notice accent to its theme
  color". Keep the `noticeSurfaceTint` tests.
- `channel-points-reward-title-from-system-msg.test.ts` (covered through
  its public caller).
- `create-ritual-token.test.ts` and `create-charity-donation-token.test.ts`,
  after the `create-user-notice-message` fix in the weak list.
- `create-seven-tv-callbacks.test.ts` "returns all callbacks and
  channel/set ids".
- `use-chat-messages.test.ts` "returns required functions".
- `use-chat-lifecycle.test.ts` "registers beforeRemove listener".
- `chat-list.test.tsx` "passes content-size change handler through to
  LegendList".
- `chat-input-section.test.tsx` "passes composer API".
- `use-composer-dismiss-gesture.test.ts`, the two tests that check stubbed
  gesture builders received constants.
- `use-emote-reprocessing.test.ts`, the two skip tests that
  `message-enrichment.test.ts` already covers.

**Screens and components**

- `auth-callback-screen.test.tsx` "renders completing sign-in message".
- `onboarding-screen.test.tsx`, the two static copy tests.
- `search-screen.test.tsx` "renders search input".
- `top-streams-screen.test.tsx` and `top-categories-screen.test.tsx`, the
  "renders ... list when data is available" tests.
- `settings-toggle-row.test.tsx` "passes false when changing the switch
  from on to off".
- `text.test.tsx`, the five default-style tests. Keep the weight and font
  family tests.
- `input-variants.test.ts`, six palette tables. Keep "does not append alpha
  suffixes to transparent".
- `native-intent.test.ts`, replaced by one `test.each` over real inputs.
- `use-player-bridge.stability.test.tsx`, the three tests that repeat
  `stability-recovery.test.ts`.
- `build-twitch-caption-hider-script.test.ts`,
  `build-twitch-content-gate-accept-script.test.ts`, and the source-text
  test at the top of `build-twitch-live-sync-script.test.ts`.
- `live-stream-card-skeleton.test.tsx` "fills the window with compact
  rows". Keep the media versus compact test.
- `saved-phrases-screen.test.tsx` "mounts the native list branch without
  crashing".

**Hooks, store and utilities**

- `auth-context.test.tsx`, "should handle anonymous token expiration and
  refresh" and "grants an anon token if user has no anon token and no user
  token".
- `resolve-emote-scale.test.ts`.
- `channel-poll-activity.test.ts` and `channel-prediction-activity.test.ts`,
  the six wrapper and constant tests.
- `streamelements-service.test.ts` "requests the channel chat stats
  endpoint and returns the payload".
- `show-action-menu.test.ts` "presents the action menu sheet on Android".
- `resolve-use-apple-webp-codec.test.ts` (optional).
- `sentryCoreConsolePatch.test.ts` "exposes instrumentConsole".

## Weak assertions

About 27. Most are `toHaveBeenCalled()` with no arguments, `toBeDefined()`,
or a length check where the ids matter. Fix each one in the same commit as
the row that touches its file. The ones with no row:

- `create-user-notice-message.test.ts` lines 458 and 480: the `expect` calls
  sit inside an `if`, so they pass silently when the type is wrong.
- `messages.test.ts`, `state.test.ts` and `channel-load.test.ts`:
  `toBeDefined` on a value that a later line reads anyway.
- The four skeleton checks of `getAllByTestId(...).length > 0`.
- `stream-player.test.tsx` lines 363 and 382: `> 1` and `> 3` remount
  counts.
- `use-chat-image-upload.test.ts`, `emote-badge-viewer-screen.test.tsx`,
  `saved-phrases-screen.test.tsx`, `forward-log-to-sentry.test.ts`,
  `icloud-sync.test.ts` and `analytics.test.ts`: calls asserted with no
  arguments.

## How to do it

- One commit per row, scope `test(<scope>)`.
- Run the touched suites before and after. A rewritten test must fail when
  the logic it covers breaks: break the code once by hand and confirm.
- Rows 2, 3, 5 and 9 cover the chat pipeline. Run `bun run test:perf` after
  them as well, because the perf tests share fixtures with these suites.

## Outcome

Every row is done. Each rewritten test failed when the code it covers was
broken by hand. The full suite has 344 suites and 7,324 tests.

These stayed, on purpose:

- `resolve-use-apple-webp-codec.test.ts`. It is the only test of the rule
  that keeps animated WebP off the Apple codec.
- `saved-phrases-screen.test.tsx` "mounts the native list branch without
  crashing". It is the only test that renders the iOS branch.
- The `getUserBadge` stub in `user-cosmetics-fetch.test.ts`. A bound badge
  always gets a URL, so real data cannot build the "no badge" case.
- In `chat.recent-messages.test.tsx`: the socket, native UI and child sheet
  stubs, and the stubs for `useChatEmoteLoader` and `useChatScroll`. The
  loader has its own suite, and the scroll hook needs the native list ref.

Running the real chat pipeline showed two behaviours. The tests pin both as
they are today:

- A CLEARMSG for a replayed message that is still in the ingest buffer
  removes the message. It does not mark it "Deleted".
- During a history replay, timeout and NOTICE rows skip the buffer, so they
  show before the history they refer to.
