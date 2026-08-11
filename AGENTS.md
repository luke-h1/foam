# Agent Notes

## Test Assertions

Use `toEqual` for object assertions. Do not use `expect.objectContaining`, and do not use `toMatchObject`.

Partial object matchers are tempting because they make tests quicker to write, but they also make the test less honest. Extra fields can appear, fields can drift, and the test still passes. That is not what we want in this repo.

When a test cares about an object contract, write the object out and compare it with `toEqual`. If only part of a large object matters, pull those fields into a smaller object first, then use `toEqual` on that smaller object. The point is to make the shape obvious to the next person reading the test.

When the expected object has a meaningful type, pass it as the matcher's type parameter: `expect(profile).toEqual<SubscriberChannelProfile>({ ... })`. The compiler then checks the expected literal against the real contract, so a renamed or mistyped field fails at typecheck time instead of reading as an intentional extra key. Skip the parameter for primitives and shapes with no named type worth pinning.

## Test Functions

Use `test()` to declare unit tests, not `it()`. Keep this consistent across every spec so the test files read the same way.

`it()` reads as an English sentence with the `describe` block, but it also reads ambiguously on its own and mixing the two styles across files adds noise for no benefit. `test('does the thing', ...)` says plainly what it is.

## Test Fixtures

Put shared test fixtures in a `__fixtures__` directory inside the relevant `__tests__` directory.

Keeping fixtures beside the tests makes the test setup easier to follow. It also stops general-purpose fixture folders from becoming a dumping ground for shapes that only make sense for one part of the app. If the fixture belongs to the chat hook tests, it should live with the chat hook tests.

Name fixture files after the thing under test, using the pattern `{thing}.fixture.ts`. For example, shared fixtures for the chat hook tests should live in `__tests__/__fixtures__/useChat.fixture.ts`.

That naming keeps the fixture tied to the surface it supports. A file called `chatHookFixtures.ts` sounds like a generic bucket. A file called `useChat.fixture.ts` says what it exists for and makes it harder to keep adding unrelated test data over time.

The one exception is a fixture the app itself imports. `src/dev/chatHotspotBench` runs the perf fixtures on-device from the `dev-tools/chat-perf` route, so those files are part of the app's module graph. EAS strips `__tests__` directories from the build context, so a fixture under `__tests__` resolves locally and then fails the eager bundle in CI with `Unable to resolve module`. Fixtures shared with the bench live in a sibling `__fixtures__` directory _outside_ `__tests__` (for example `src/utils/chat/__fixtures__/resolveMessageEmoteParts.perf.fixture.ts`), and the perf-test imports them with `../__fixtures__/...`. The `no-tests-dir-import` ast-grep rules enforce this.

## Legend State Store Layout

Legend State is unopinionated about folder shape, but we split observables, actions, and React bindings so components do not import `@legendapp/state` primitives directly.

```
src/store/
  chat/
    observables/   # module-level observables (chatStore$, chatTransientState$)
    types/         # shared chat store types and constants
    actions/       # pure mutations against observables (no React hooks)
    react/         # useSelector / useObservable hooks for components
  preferences/
    state.ts       # re-export shim over store/preferenceStore.ts
    selectors.ts   # usePreferences and related hooks
```

The preferences observable itself lives in `src/store/preferenceStore.ts` - that file is the source of truth for `preferences$`, persistence, and `getPreferences`. `store/preferences/state.ts` only re-exports it so both import paths share one observable; two parallel observables persisted to the same MMKV key desync within a session.

Import chat store modules directly (for example `@app/store/chat/observables/chatStore`, `@app/store/chat/actions/messages`, `@app/store/chat/types/constants`). Do not add barrel exports under `store/chat`.

## Inline Simple Values

This applies only to obvious, self-explanatory single-use literals — chiefly styles (a one-off colour, size, or spacing) and single-use UI strings. Do not lift those into a named constant just to reference them once; inline them at the use site.

```ts
// avoid
const CARD_BG = '#1C1C1E';
<View style={{ backgroundColor: CARD_BG }} />

// prefer
<View style={{ backgroundColor: '#1C1C1E' }} />
```

A name like `THE_COLOR_OF_A_COMPONENT = '#55'` adds a layer of indirection without adding information — the literal already says everything the name does.

This is **not** a blanket "inline every single-use value" rule. Keep a named constant (or an inline explanatory comment) when the literal encodes non-obvious meaning the value alone cannot convey — a magic number such as a memory threshold (`3 * 1024 * 1024 * 1024` // 3GB), a tuned timeout, a protocol constant, or anything a reader would have to reverse-engineer. Also keep module-level constants for values genuinely shared across files that must stay in sync. The rule targets needless indirection over obvious literals, not the removal of meaningful names.

**The chat render path is exempt.** Every font size, line height, emote size and row padding a chat row uses must come from `getChatScale` / `getChatTextStyles` (`components/ChatMessage/chatScale.ts`, `chatText.styles.ts`), never from a literal at the use site. Density and font scale are two preferences over one ramp; a literal in a renderer silently opts that surface out of one of them, which is the bug the ramp was introduced to fix. Inlining a `lineHeight: 21` in a chat renderer follows the letter of the rule above and regresses the feature.

## JSDoc Comments

Write JSDoc comments as multi-line blocks. Never collapse them onto a single line.

```ts
/**
 * VOD resume offset in seconds; only applied when `video` is set.
 */
timeSeconds?: number;
```

Do not write `/** VOD resume offset in seconds; only applied when video is set. */` on one line, even when the comment is short and even for `/** @type {...} */` annotations. The opening `/**`, the `*` content, and the closing ` */` each get their own line, indented to match the code they document.

The multi-line form is the format the repo uses everywhere, so keeping to it avoids a mix of styles and keeps comments easy to extend later without reflowing the line.

Put new module-level observables in `observables/`. Put write helpers that call `.set()` / `.peek()` in `actions/`. Put `useSelector` and `useObservable` in `react/`. Session-scoped state that components subscribe to belongs on `chatStore$`. Hot-path caches that are only read imperatively during ingest or render (mention colours, shared chat badges) are the exception: keep those as plain module-level `Map`s with an explicit size bound and clear function (see `src/store/chat/actions/chatColorCaches.ts`) - routing them through an observable clones and key-diffs the whole bucket on every write. Such caches live in a store `actions/` or chat `util/` module, never inline in a component file. Pure message transforms like `getVisibleMessages` live in `components/Chat/util/`. Do not wrap Legend State mutations in `useCallback` unless a React API (imperative ref, effect deps) needs a stable function reference.

## React Doctor: package.json dependency rules

`deslop/unused-dependency` and `deslop/unused-dev-dependency` are turned off for `package.json` in `doctor.config.json`. They only follow static JS imports, so they false-positive on every package this app loads through a channel they can't scan. Do not remove a dependency just because react-doctor (or a quick `bun why`) reports it unused — check these channels first:

- **Config plugins** — `@rnrepo/expo-config-plugin` (string in the `app.config.ts` `plugins` array).
- **Font assets** — `@expo-google-fonts/source-code-pro` (referenced by file path in the `expo-font` config plugin, never imported).
- **Auto-discovered devtools** — `@rozenite/expo-atlas-plugin`, `@rozenite/react-navigation-plugin` (Rozenite loads installed plugin packages without a JS import).

Because the rule is off for `package.json`, a genuinely unused dependency won't be flagged automatically — verify by hand when adding or removing deps.

## React Doctor: useNativeState immutability override

`react-hooks-js/immutability` is turned off for `BlockedTermsScreen.tsx` and `SavedPhrasesScreen.tsx` in `doctor.config.json`. Their iOS branches bind `@expo/ui/swift-ui` `useNativeState` values to SwiftUI text fields, and writing back through `state.value = ...` is that API's intended write path - the rule misreads those writes as mutation of an immutable hook value. Scope any future exemption to the specific files the same way rather than turning the rule off globally.

## Bottom sheets: `@expo/ui` plus a not-yet-released iOS touch fix

Every sheet goes through `src/components/BottomSheet/BottomSheet.native.tsx`, which wraps `@expo/ui/community/bottom-sheet`: a SwiftUI `.sheet` on iOS, a Material 3 `ModalBottomSheet` on Android.

Sizing differs per platform on purpose. iOS gets the snap points as real `presentationDetents`, so the sheet drags between them and re-lays out on rotation by itself, and the content flexes to fill. Android's `ModalBottomSheet` has only a partial and an expanded state, so a fraction like `0.78` has nowhere to land; there the wrapper omits detents, lets the sheet size to its content, and puts the resolved pixel height on the content view. A flexed child under fit-to-content measures as zero and the sheet presents blank, so `flex: 1` is applied only on the detented path.

`onDismiss` fires when the dismissal starts, not when it finishes, and consumers unmount the sheet on it. The wrapper holds the callback for the length of the transition; without that the native outro is cut off partway.

`patches/@expo%2Fui@57.0.8.patch` carries [expo/expo#48259](https://github.com/expo/expo/pull/48259), which is still open upstream. Sheet content is hosted in `RNHostView` on iOS, and without the patch a hosted `Pressable` drops `onPress` on any finger movement ([#48131](https://github.com/expo/expo/issues/48131)). That makes the emote grid close to untappable, since its rows resolve the tapped emote from `locationX`. The patch also needs `expo-modules-core` >= 57.0.8, where `ExpoViewShadowNode.h` consumes the `layoutRoot` prop it adds. Drop the iOS hunks once the PR ships; the Android half of the same bug is already fixed in 57.0.8.

## Android: the `@expo/ui` source build is load-bearing

`package.json` sets `expo.autolinking.android.buildFromSource: ["^expo-ui$"]`, which forces `@expo/ui` to compile from source on Android instead of resolving the RNRepo prebuilt. That entry exists so `patches/@expo%2Fui@57.0.8.patch` actually lands - the patch adds `icon = {}` to `SegmentedButtonView.kt`, without which the Compose segmented control renders a checkmark that shunts the label off-centre.

Nothing in `src/` imports `SegmentedButton` by name, so a grep makes both the patch and the autolinking entry look dead. They are not: `src/components/SegmentedControl/SegmentedControl.tsx` imports `@expo/ui/community/segmented-control`, whose `SegmentedControl.android.tsx` renders `SingleChoiceSegmentedButtonRow` / `SegmentedButton` from the jetpack-compose tree. Removing either the patch or the `buildFromSource` entry silently regresses every Android segmented control.

Do not add `minSdkVersion` to the `build.gradle` of a module in `modules/`. `expo-module-gradle-plugin` already sets `minSdk` from the root project (`ProjectConfiguration.kt`), so a local value would pin the module below the app the next time the app's `minSdkVersion` moves.

## Haptics: react-native-pulsar via the src/lib/haptics.ts wrapper

All haptic feedback goes through the `impact` / `selection` helpers in `src/lib/haptics.ts`, backed by `react-native-pulsar`. The wrapper gates every call on the `hapticFeedback` preference, so importing `react-native-pulsar` directly from a component would bypass the user's setting - `no-restricted-imports` in `eslint.config.mjs` blocks it.

The same rule bans `expo-haptics`, which the wrapper used to sit on. Its Android `Segment_Tick` path resolves an API 34+ `HapticFeedbackConstants` field, so every selection haptic on Android < 14 rejects with a misleading "A haptics engine is not available on this device" error (Sentry FOAM-TV-MOBILE-1R). Pulsar checks device capability (`Settings.getHapticsSupportLevel()`) instead of throwing.

If a surface needs more than impact/selection (richer presets, pattern or realtime composers), add a named helper to `src/lib/haptics.ts` so the preference gate still applies, rather than exempting the call site from the lint rule.

## Chat message identity

`src/utils/chat/messageIdentity/` owns the one rule for what identifies a chat
message. `getChatMessageKey` composes `message_id` + `message_nonce`,
`getChatMessageStoreId` prefers the store-assigned `id` and falls back to that
key, `getChatMessageListKey` is the list's `keyExtractor`, and
`isRenderableChatMessage` is the validity guard.

All three consumers - the store's dedup index (`store/chat/actions/messages`),
the pre-commit ingest buffer (`components/Chat/util/messageBuffer`) and the
list - must agree, because `ChatMessagePane` dropped its render-time dedup on
the strength of that agreement. Re-deriving the key locally is how duplicate
rows and broken scroll anchoring get in; add a consumer to the shared module
instead. `getChatMessageStoreId.test.ts` pins the agreement.

Likewise `normaliseChatUsername` (`utils/chat/chatUsernames/`) is the only
login normaliser - it trims, strips a leading `@`, and lowercases. A local
`trim().toLowerCase()` beside it forks the key space for any `@`-prefixed
value.

## Chat body scanning

`src/utils/chat/deriveChatBody/scanChatBody.ts` walks a message's parts exactly
once and caches the result: whether the body can flow inline, whether it holds
emotes, which notice it is, and who it mentions. `deriveChatBody`,
`getMessageStructure` and `canFlowInline` are all views over that one scan.

Inline eligibility in particular used to be written three times, and a new
inline-breaking part type had to be added to all three. Ask `canFlowInline`
(a type predicate, so it also narrows the parts for the inline renderers)
rather than re-testing part types at a call site.

## Chat overlays

Chat sheets live behind `store/chat/observables/chatOverlays` +
`store/chat/actions/chatOverlays`. `ChatOverlayLayer` subscribes to that
observable itself, and the press handlers in `useChatOverlayActions` call the
actions directly, so opening or dismissing a sheet re-renders the overlay
subtree and never the chat root or the message list. Do not lift the overlay
state back up into a hook, and do not return JSX from one.

Hydration scratch state for the visible-asset pass lives in
`store/chat/actions/visibleAssetHydration` for the same reason: it is only ever
read imperatively during ingest, so as React refs it had to be created in an
unrelated hook and drilled two levels to its only consumer.

## Normalising chat strings

Two normalisers, and the distinction is load-bearing:

- `normaliseChatUsername` (`utils/chat/chatUsernames/`) - trims, strips a
  leading `@`, lowercases. For logins, display names, hidden/highlighted users.
- `normaliseChatText` (`utils/chat/normaliseChatText`) - trims and lowercases
  only. For message bodies, search queries, hidden phrases, highlight phrases.

Running free text through the username normaliser turns a search for `@luke`
into a search for `luke` and silently drops the `@` from a hidden phrase. A
local `trim().toLowerCase()` is a third variant - reach for one of these two.
