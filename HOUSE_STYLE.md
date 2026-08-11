# House Style

Distilled from the best hand-written files in the repo: `utils/chat/chatIngestRateLimiter.ts`,
`utils/chat/deriveChatBody/scanChatBody.ts`, `components/Chat/util/messageBuffer.ts`,
`components/Chat/components/ChatMessage/chatScale.ts`, `store/chat/actions/chatColorCaches.ts`,
`components/Chat/util/chatRowSizeBucket.ts`, and `modules/cpu-usage/ios/CpuUsageModule.swift`.
This is the voice to match. Where instinct disagrees with this file, this file wins.

## Comments

- Sparse and uneven. Comments cluster where the code cannot speak: tuned constants, cache
  bounds, cross-file couplings, protocol quirks, ordering requirements. Obvious code gets
  nothing - `clearSessionCache`, `densityFromCompact`, and most functions carry no comment
  at all.
- Every comment is a why-comment, usually with a concrete number or a named counterpart:
  "read imperatively at up to ~100 msg/s", "matches the 1.5 ratio the 7TV extension locks
  its chat list to", "so one copypasta cannot open a bucket of its own".
- JSDoc is always the multi-line block form, always prose, one short paragraph stating the
  contract or the reason. **No `@param`, `@returns`, `@example`, `@template`, `@typeParam`
  on typed TypeScript** - the signature already says it. The handful of files still carrying
  those tags are the slop this sweep removes.
- A module preamble, when one exists, is a `//` run or a single block at the top saying what
  the module is for and which rule it lives under (see `chatIngestRateLimiter.ts`,
  `chatColorCaches.ts`). Most modules have none.
- British spelling in prose and identifiers: normalise, colour, behaviour, sanitised.
- Plain `-` as the sentence dash, never an em dash. (A few `—` exist, e.g. in
  `messageBuffer.ts`; new writing uses `-`.)
- No banners, no step narration, no closing-brace labels, no changelog comments. The repo
  currently has zero of each - keep it that way.

## Naming

- Full words, domain vocabulary. `message`, not `msg` or `data`; `login` when it is a
  normalised login, `username`/`displayName` when it is not; `emoteSet`, `channel`, `parts`,
  `usernotice`, `roomstate`, `cosmetics`, `paint`, `badge`.
- Verb conventions: `create*` for factories, `get*` for pure lookups, `resolve*` for
  derivations, `normalise*` for normalisers, `build*` for constructed values,
  `should*`/`is*`/`has*`/`can*` for predicates. Handlers on props are `on*`.
- Pipeline vocabulary is settled and load-bearing: ingest → buffer → `drain` → flush →
  commit → render; `hydrate` for cosmetic/asset fill-in. Reuse these words, do not coin
  synonyms.
- `SCREAMING_SNAKE` for module-level tuned constants; plain `camelCase` for module-level
  mutable state (`tokens`, `lastRefill`, `nonceCounter`).
- No `I`/`T` prefixes on types (one stray `IEnergyOrb` is on the worklist). No enums in
  hand-written code - string-literal unions (`'comfortable' | 'compact'`). Enums appear only
  in generated GraphQL, which is out of scope.
- Files are named for their single export; utils live one-function-per-file in area-scoped
  `util/` folders. No barrel files; imports use the full path including filename.

## Types

- `interface` for named object contracts (public API shapes, props); `type` for unions,
  aliases, and small result shapes (`type AddResult = {...}` next to
  `interface MessageBuffer`). Both are current style - do not convert one to the other.
- Exported functions carry explicit return types, including `: void`. Locals are inferred.
- `as const`, `satisfies`, and constrained generics (`Args extends unknown[]`) are used
  deliberately and kept. Generics exist only where two call sites need them.
- Tests pin contracts with `toEqual<TheType>({...})`; created literals use
  `satisfies TypeName`.

## Structure

- Early return everywhere; no `else` after `return`; guard clauses at the top.
- Factories returning object literals, not classes (`createMessageBuffer`). Dependencies
  injectable with a defaulted parameter when a test needs to exercise a bound.
- Hot-path caches are plain module-level `Map`s with an explicit size bound and a clear
  function; per-object derived data goes in a `WeakMap` keyed by the source object. Never
  route these through an observable.
- Switch statements over part/message types, with the interesting cases first and a
  `default` that handles the family (see `scanChatBody`, `getPartWeight`).

## Error handling

- Pure utils and transforms never catch - they are total over their inputs or they throw.
- try/catch exists only at real boundaries: websocket event handlers wrap each handler and
  report through `logEventHandlerError('<event.name>', error)`; JSON from untrusted
  payloads; native-module edges. A catch always names its context and forwards to the
  logger/Sentry - never a bare swallow or a silent `return null`.
- No null-guards on values the types already guarantee; truthiness checks over
  `!== undefined && !== null` chains where they read fine.

## React

- Components self-subscribe at the leaf (`useSelector`); state components need lives in the
  store, not drilled props. Overlay/sheet state lives in observables and actions, never JSX
  from hooks.
- React Compiler is on: no speculative `useMemo`/`useCallback`/`React.memo`. A manual memo
  exists only with a comment or perf test saying why.
- Chat render path takes every size from `getChatScale`/`getChatTextStyles` - a literal
  font/emote/row size in a chat renderer is a bug, not a style choice.

## Tests

- `test()`, never `it()`. `toEqual`, never `toMatchObject`/`objectContaining`, typed where
  a named type exists. Fixtures in `__tests__/__fixtures__/{thing}.fixture.ts` (except the
  app-imported perf fixtures, which live in a sibling `__fixtures__` outside `__tests__`).

## Swift / Kotlin (modules/)

- Comment-free where the platform API speaks for itself; `guard`/`defer`/early exit;
  `private static` helpers under the module definition; no defensive wrapping around
  KERN_SUCCESS-style checks beyond the check itself.

---

# Sweep worklist (slop-density ranking, 2026-08-11)

The classic tells are already absent repo-wide: zero banners, zero step comments, zero
closing-brace labels, zero commented-out code, 1 `as any` and 4 `: any` outside tests.
What remains is the pre-house-voice service/util layer carrying JSDoc scaffolding, ranked:

1. `src/services/twitch-service.ts` - 1073 lines, old voice; empty `@param token` tags,
   `@returns` restating typed signatures. Largest single target.
2. `src/services/ws/util/indexedCollection.ts` - full scaffolding (`@typeParam`, `@param`,
   `@returns`, two `@example` blocks), "This utility handles..." narration, `result`
   variable, `as T` cast worth a look.
3. `src/services/seventv-service.ts` - 3 scaffolding tags, same era as twitch-service.
4. `src/utils/version/compareVersions.ts` - `@param`/`@returns` restating signatures.
5. `src/utils/color/sevenTvColorToCss.ts` (+ sibling `sevenTvColorToRgba`) - restating
   JSDoc + `@example`.
6. `src/utils/typescript/OpenStringUnion.ts` - "A utility type that allows... This is
   useful when..." narration; the `@example` may earn its keep, the prose does not.
7. `src/utils/string/generateNonce.ts` - good why-sentence buried under `@returns {string}`
   (type-restating, wrong dialect for TS) and a trivial `@example`.
8. `src/hooks/useDebouncedCallback.ts` - malformed inline `{@param}` tags.
9. `src/utils/chat/replaceEmotesWithText.ts`, `src/Providers/ScreenDimensionsProvider/dimensions.ts`,
   `src/components/Form/Form.tsx`, `src/utils/chat/parseBadges.ts` - 1-2 tags each.
10. `src/components/EnergyOrb/types.ts` - `IEnergyOrb` prefix rename.

Inspect-don't-assume (high comment counts that are probably legitimate protocol docs):
`src/types/seventv/cosmetics.ts` (218 comment lines - 7TV protocol shapes),
`src/components/StreamPlayer/types.ts` (184 - player bridge protocol),
`src/types/chat/irc-tags/*.ts` (IRC tag semantics). Prune only tags that restate types;
keep every field-meaning sentence.

Confirmed NOT slop (do not touch): try/catch in `useSeventvWs.ts` /
`seventvWsInterpreter.ts` (boundary handling with named-event logging), the injected-JS
`try` blocks in `components/StreamPlayer/twitchPlayerSource/*Script.ts` (they run inside
the WebView), all dense comments in the chat hot path (perf-campaign invariants), and
`AuthContext.tsx` (hard rule: auth paths are off limits regardless of style).
