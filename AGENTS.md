# Agent Notes

## Test Assertions

Use `toEqual` for object assertions. Do not use `expect.objectContaining`, and do not use `toMatchObject`.

Partial object matchers are tempting because they make tests quicker to write, but they also make the test less honest. Extra fields can appear, fields can drift, and the test still passes. That is not what we want in this repo.

When a test cares about an object contract, write the object out and compare it with `toEqual`. If only part of a large object matters, pull those fields into a smaller object first, then use `toEqual` on that smaller object. The point is to make the shape obvious to the next person reading the test.

## Test Functions

Use `test()` to declare unit tests, not `it()`. Keep this consistent across every spec so the test files read the same way.

`it()` reads as an English sentence with the `describe` block, but it also reads ambiguously on its own and mixing the two styles across files adds noise for no benefit. `test('does the thing', ...)` says plainly what it is.

## Test Fixtures

Put shared test fixtures in a `__fixtures__` directory inside the relevant `__tests__` directory.

Keeping fixtures beside the tests makes the test setup easier to follow. It also stops general-purpose fixture folders from becoming a dumping ground for shapes that only make sense for one part of the app. If the fixture belongs to the chat hook tests, it should live with the chat hook tests.

Name fixture files after the thing under test, using the pattern `{thing}.fixture.ts`. For example, shared fixtures for the chat hook tests should live in `__tests__/__fixtures__/useChat.fixture.ts`.

That naming keeps the fixture tied to the surface it supports. A file called `chatHookFixtures.ts` sounds like a generic bucket. A file called `useChat.fixture.ts` says what it exists for and makes it harder to keep adding unrelated test data over time.

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
    state.ts       # preferences$ observable + persistence
    selectors.ts   # usePreferences and related hooks
    index.ts
```

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

Put new module-level observables in `observables/`. Put write helpers that call `.set()` / `.peek()` in `actions/`. Put `useSelector` and `useObservable` in `react/`. Session-scoped caches (mention colors, shared chat badges) belong on `chatStore$`, not module-level `Map`s in components. Pure message transforms like `getVisibleMessages` also live in `actions/`. Do not wrap Legend State mutations in `useCallback` unless a React API (imperative ref, effect deps) needs a stable function reference.

## React Doctor: package.json dependency rules

`deslop/unused-dependency` and `deslop/unused-dev-dependency` are turned off for `package.json` in `doctor.config.json`. They only follow static JS imports, so they false-positive on every package this app loads through a channel they can't scan. Do not remove a dependency just because react-doctor (or a quick `bun why`) reports it unused — check these channels first:

- **Config plugins** — `@rnrepo/expo-config-plugin` (string in the `app.config.ts` `plugins` array).
- **Font assets** — `@expo-google-fonts/source-code-pro` (referenced by file path in the `expo-font` config plugin, never imported).
- **Build-cache providers** — `eas-build-cache-provider` (powers `expo.experiments.buildCacheProvider: 'eas'`).
- **Auto-discovered devtools** — `@rozenite/expo-atlas-plugin`, `@rozenite/react-navigation-plugin` (Rozenite loads installed plugin packages without a JS import).

Because the rule is off for `package.json`, a genuinely unused dependency won't be flagged automatically — verify by hand when adding or removing deps.

## React Doctor: useNativeState immutability override

`react-hooks-js/immutability` is turned off for `BlockedTermsScreen.tsx` and `SavedPhrasesScreen.tsx` in `doctor.config.json`. Their iOS branches bind `@expo/ui/swift-ui` `useNativeState` values to SwiftUI text fields, and writing back through `state.value = ...` is that API's intended write path - the rule misreads those writes as mutation of an immutable hook value. Scope any future exemption to the specific files the same way rather than turning the rule off globally.
