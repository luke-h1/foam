# De-slop report (2026-08-11)

Phase 0 found the repo already close to the house voice: zero banner comments, zero step
narration, zero closing-brace labels, zero commented-out code, and defensive noise near
zero repo-wide. The sweep therefore reduced to one comment pattern, two renames, and a
test-title pass. All changes are uncommitted on `main`, mixed into a working tree that
already carried the perf-campaign edits - separate before committing.

## Changed

**Comments (-142 lines net in non-test files, +45 -187)**
JSDoc scaffolding (`@param`/`@returns`/`@example`/`@typeParam` restating typed signatures,
"This utility handles..." narration) pruned to house-voice prose, keeping every fact the
signature does not express:

- `services/twitch-service.ts` - getTopStreams block rewritten; create/delete EventSub
  restating sentences dropped; listEventSubscriptions trimmed to the one non-obvious fact
  (only returns the client's own subscriptions). All `@see` links kept. **Auth paths
  (`getDefaultToken`, `validateToken`, `getRefreshToken`) untouched, comments included.**
- `services/ws/util/indexedCollection.ts` - both blocks rewritten; `result` renamed
  `items`; the `as T` cast replaced by hoisting `collection[i]` into a local (same
  narrowing, no cast).
- `services/seventv-service.ts` - two blocks; kept "7TV user id, not the Twitch id".
- `components/StreamPlayer/types.ts` - restating getter/setter comments dropped; units
  kept ("seconds", "VODs only", "0-1").
- `types/seventv/cosmetics.ts` - PaintData prose + 20-line example collapsed to two
  lines; bit-layout and field-level protocol docs untouched.
- `utils/version/compareVersions.ts`, `utils/color/sevenTvColorToCss.ts`,
  `utils/string/generateNonce.ts`, `utils/typescript/OpenStringUnion.ts`,
  `hooks/useDebouncedCallback.ts` (malformed `{@param}` tags),
  `utils/chat/parseBadges.ts`, `utils/chat/replaceEmotesWithText.ts`,
  `Providers/ScreenDimensionsProvider/dimensions.ts`, `components/Form/Form.tsx`.

**Structure**

- `replaceEmotesWithText.ts` - eleven switch cases that all returned
  `getParsedPartStringContent(part)` collapsed into `default`; `!parts ||` guard on a
  non-optional parameter dropped.

**Naming**

- `IEnergyOrb` → `EnergyOrbProps` (`components/EnergyOrb/`).
- `src/styles/pallete.ts` → `palette.ts` (misspelled since 2023); 7 imports updated.

**Tests (~150 titles across 22 files)**

- `test('should find X')` → `test('finds X')`; `should not` → `does not`. Titles only -
  no assertions, setup, or expectations touched. No snapshot tests were affected (none
  of the files use snapshots). `AuthContext.test.tsx` skipped (auth hard rule).

## Flagged, not changed

- `twitch-service.ts:177` - `condition: object; // todo - type better` on
  `EventSubscription`. Real unfinished typing, needs the Twitch condition shapes.
- `Form.tsx` - `@ts-expect-error - not all code paths return a value` on a `useEffect`
  whose cleanup is conditional. Fixable by returning `undefined` explicitly, but that is
  a code change in a file I only touched for comments.
- `formatViewCount.ts` lint warning (`react-doctor/js-hoist-intl`) is a false positive:
  the formatter is lazily cached via `??=` on purpose (module-scope construction sat on
  the boot path). The rule cannot see the memoization. Options: suppress with a scoped
  disable + reason, or leave the warning.
- Remaining pre-existing lint warnings, all refactors rather than de-slop:
  `SettingsIndexScreen.tsx` and `ChatPreferenceForm.tsx` (giant components),
  `usePlayerBridge.ts` (3 setState calls in one effect - file is mid-perf-campaign),
  `SyncedEmotesScreen.tsx` (ScrollView + map in a dev-tools screen).
- `test('should X')` remains in `AuthContext.test.tsx` (~9 titles) - off limits.
- `services/twitchService.ts` vs `services/twitch-service.ts` naming style splits the
  services folder (also `seventvService.ts` vs `seventv-service.ts`, from the 2023 era).
  A file-rename pass would unify it; left alone as churn without a correctness win.

## Behaviour-change proposals (separate PR)

- None required. The only candidates surfaced (Form.tsx effect return, EventSub
  condition typing) are listed above as flags.

## Patterns worth encoding

- ast-grep rule: forbid `@param`/`@returns`/`@example` in `src/**` JSDoc - the signature
  already carries it, and this was the only slop class that survived earlier sweeps.
- ast-grep or eslint rule: forbid `test('should ...')` titles.

## Verification

- `tsc --noEmit` - clean.
- `eslint .` - 0 errors; 5 warnings, all pre-existing and unrelated (see flags).
- `ast-grep scan` - clean.
- `jest` - 341 suites, 10146 tests, all passing.
