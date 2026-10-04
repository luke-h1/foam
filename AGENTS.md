# Agent Notes

## Where things live

Open the matching file before you search for it.

- Domain words, the chat pipeline and the release pipeline: `docs/CONTEXT.md`.
- Why the architecture is the way it is: `docs/adr/`.
- UI rules for every screen: `DESIGN.md`. Read it before you touch UI.
- React Doctor overrides and why each one exists: `docs/react-doctor.md`.
- The bottom sheet wrapper, `patches/` and Android source builds: `docs/native-patches.md`.
- App Store review history and rejections: `app-store-review-guidance/REVIEWER_NOTES.md` and `app-store-review-guidance/feedback/`.
- Library mocks for tests: root `__mocks__/<package>/`. A new import entry point needs its own mock file.
- Storybook config: `.rnstorybook/`. Metro rewrites `.rnstorybook/storybook.requires.ts` on start. Revert it unless you added or removed a story.
- Commit scopes: `commit-scopes.js`. PR template: `.github/PULL_REQUEST_TEMPLATE` (no extension).

Other agent sessions often edit this checkout at the same time. Check which sessions are running (for example with `ListAgents`) before you treat uncommitted changes as yours. Do not run `git stash`: it takes their files too. Use `git worktree add` to compare against `main`.

## Writing style: plain English (ASD-STE100)

Write everything you author in this repo - code comments, commit messages, PR descriptions, this file, any doc - in plain English, following the spirit of [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/). The goal is a comment or message that the next reader (human or agent) understands on the first pass, with nothing to decode.

- One idea per sentence. Keep sentences short.
- Use active voice: "the hook resets the flag," not "the flag is reset by the hook."
- Use the plainest word available. Say "use," not "utilize"; say "before," not "prior to"; say "show," not "surface" or "expose" as a verb.
- Use one word for one meaning, consistently, rather than varying the word for style.
- Write instructions as direct commands: "run X," "add Y," not "one might consider running X."
- Avoid stacked nouns used as adjectives ("chat message row render path" - split it up).
- Avoid idioms, hedging filler, and jargon that only makes sense with outside context.
- Prefer plain dashes and short words. No em dashes - see the global style rule already in force for this account.

This applies to prose you write, not to code identifiers or established technical terms this file already uses (React, hook, ref, etc.) - keep those as they are.

## Writing density: no mannered prose

This follows the [writing density guidance for Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1#writing-density). Newer models write denser prose: sentences run long and paragraph breaks are rare. Keep prose lean and literal.

The anti-pattern to avoid is mannered prose:

> Mannered prose substitutes metaphor and flourish for direct statement. Instead of "a parameter worth varying," the mannered writer produces "a dial worth turning." Instead of "this point still matters," they write "this point earns its keep." The phrases exist to display the writer, not to convey the idea, and readers can tell. That is why mannered prose irritates: it makes the reader work harder so the writer can perform. It is also imprecise. Metaphors drag in connotations the writer did not choose and cannot control. The fix is to say what you mean. When a literal phrase is available, use it.

- When a literal phrase is available, use it. Do not reach for a metaphor.
- Keep sentences short and break long runs of text into paragraphs.
- Remove all mannered prose from anything you write here before handing it back.

## Local CI and signoff

The PR workflows can be run here rather than waiting on a runner.

- `bun run ci:local` - runs everything the PR workflows run. Does not fail fast: every job runs and the summary at the end lists what broke. Run this before handing a branch back.
- `bun run ci:local <job>...` - only the named jobs, for iterating on one failure. Jobs are `prettier`, `ast-grep`, `ts`, `docs`, `variants`, `lint`, `oxlint`, `test`, `native`, `commitlint`, `doctor`, `zizmor`.
- `bun run signoff` - runs the full suite and, if it is green, posts a `signoff` commit status via [gh-signoff](https://github.com/basecamp/gh-signoff). Push first: `gh signoff` refuses unless HEAD is contained in `@{push}`.

`signoff` is **not** a required check - merges still gate on the GitHub workflows - so it records that the suite passed locally rather than unlocking anything. `gh signoff install` would make it required. It deliberately takes no job filter, because the status asserts that every check passed. If a job fails for a reason the change did not cause, fix it or say so explicitly; do not sign off around it.

Each job writes its full output to a log in `.ci-local/`. The summary prints the failing lines and the log path, so read the log instead of re-running the job. The `native` job passes ktlint only the tracked Kotlin files. Read the comment above it in `scripts/ci-local.sh` before you change that.

## Folder structure and file names

Every file and directory under `src/` is kebab-case: `live-stream-screen.tsx`,
`use-chat-scroll.ts`, `src/components/bottom-sheet/`. Exported React components
keep their PascalCase identifiers; only the file name changes. The one exception
is `src/app/`, where expo-router turns the file name into the URL, so route
files keep the name the route needs.

A component or screen owns a directory, and everything that only that surface
uses lives inside it:

```
src/screens/search-screen/
  search-screen.tsx        # the screen itself
  components/              # components this screen alone renders
  hooks/                   # use-* hooks this screen alone calls
  util/                    # pure helpers, types and state shapes
  constants.ts             # shared constant values
  __tests__/               # tests, with __fixtures__ inside
```

- Put a `use-*` hook in `hooks/`, never beside the component.
- Put pure helpers, type-only modules and state shapes in `util/`.
- Put a component that is not itself a screen in `components/`.
- Put constants a second module imports in `constants.ts`, not in a `.tsx`
  file. A `.tsx` file exports components. This does not override
  **Inline Simple Values** below: a one-off literal still belongs at its use
  site.
- Keep `.styles.ts` and `.types.ts` companions beside the file they serve -
  the shared name already ties them together.
- Before you change a component, run `ls <name>*`. Platform variants
  (`.ios.tsx`, `.android.tsx`, `.web.tsx`), `.stories.tsx` and `.perf-test.tsx`
  files share its contract. `bun run variants:check` fails when a variant
  lacks an export or a prop that the base file has.

`src/components/` holds the components more than one screen uses, and follows
the same shape.

Do not invent a fourth bucket. A folder of pure layout helpers called
`live-stream-layout/` sitting beside `util/` was the smell this rule exists to
stop: those files were helpers, a constant and a type, so they belong in
`util/`, `constants.ts` and `types.ts`. When a group of `util/` modules is
cohesive enough to want its own name, nest it _under_ `util/`
(`util/twitch-player-source/`, `util/room-state/`), never beside it.

Two more folder rules that follow from the same idea:

- **A folder is named after what it holds.** A `search-history/` folder holds
  `search-history.tsx`, not `search-history-v2.tsx`. A version suffix with no
  other version is dead naming - drop it.
- **A component folder holds a component.** A folder whose only contents are a
  `constants.ts` or a `hooks/` directory is not a component - the hook is
  app-wide and belongs in `src/hooks/`, the constant in `src/constants/`.

`src/lib/` wraps third-party surfaces (Sentry, MMKV, haptics, react-query);
`src/utils/` holds pure helpers grouped by domain. Keep that split.

## Let statements breathe

Separate neighbouring statements with a blank line when either one spans more
than a single line, or when the second carries its own comment. A run of short,
single-line statements stays together - the blank lines mark where one step
ends and the next begins, so they only help when there is a step to mark.

```ts
// avoid
const sourceUri = getSourceUri(source);
const shouldUseFileCache = cacheToFile && imageFileStore.enabled;
const diskCachedSource =
  sourceUri && shouldUseFileCache && cachePolicy !== 'none'
    ? imageFileStore.getCachedImageUri(sourceUri, { variant: cacheVariant })
    : undefined;
const [downloadedCache, setDownloadedCache] = useState<DownloadedCache>({
  sourceUri: undefined,
  source: undefined,
});

// prefer
const sourceUri = getSourceUri(source);
const shouldUseFileCache = cacheToFile && imageFileStore.enabled;

const diskCachedSource =
  sourceUri && shouldUseFileCache && cachePolicy !== 'none'
    ? imageFileStore.getCachedImageUri(sourceUri, { variant: cacheVariant })
    : undefined;

const [downloadedCache, setDownloadedCache] = useState<DownloadedCache>({
  sourceUri: undefined,
  source: undefined,
});
```

The first two lines read as one step, so they stay joined. Everything after it
is its own step and gets its own space.

A short inline block is the exception. A two-statement IIFE or callback body
reads better tight, so leave those alone. `src/components/image/image.web.tsx`
is the reference for how a finished file should look.

A blank line before a comment also fixes what the comment attaches to: with no
gap above it, a comment reads as a trailing note on the previous statement
rather than a heading for the next one.

## Cognitive complexity

Two numbers matter, and they answer different questions.

**A function's own complexity** - its branches, loops and boolean runs, not
counting the closures nested inside it - answers "can someone read this
function". Keep it low. Anything past about 40 is a function doing too much;
extract until it isn't. The remaining high scores in this codebase are all
dispatch tables (`runSevenTvWsDecision`, `interpretPlayerMessage`,
`buildSubscriptionNoticeDescription`), which are wide rather than deep and read
fine as one `switch`.

**A function's total complexity** - the same measure, but with every nested
closure rolled in - answers "how much does this unit do". A hook holding
fifteen simple `useCallback`s scores high even though no single callback is
hard to read. That is breadth, not tangle, and the fix is to move a _cohesive
group_ out, not to shuffle callbacks around:

- Pull a whole concern into its own hook: `useLiveStreamOrientation`,
  `useLiveStreamChatControls`, `useChatLivenessWatchdog`.
- Pull a JSX sub-tree into its own component: `LiveStreamVideoPane`,
  `LiveStreamChatPane`.
- Split a handler table by concern, each factory taking only what it needs:
  `createChatMessageRouteHandlers` / `createChannelStateRouteHandlers`.
- Separate deciding from doing, which this codebase already does in two places:
  an interpreter returns a decision, a runner carries it out
  (`seven-tv-ws-interpreter` + `runSevenTvWsDecision`,
  `player-bridge-interpreter`).

The test of a good split is the parameter list. If moving a group out needs
fifteen closures threaded through a deps object, it was not a seam - leave it
and say why. `useChatScroll` is the standing example: its refs are one scroll
state machine, and prising them apart would make it worse.

## No nested `if`

The `no-nested-if-ts` / `no-nested-if-tsx` ast-grep rules enforce this, so
`bun run lint:ast-grep` (and the `ast-grep` CI job) fails on a new one. There
are no nested `if` statements left in `src/`, and new code should keep it that
way. An `if` inside another `if` is the signal to do one of these instead:

- **Merge the conditions.** `if (a) { if (b) {...} }` is `if (a && b) {...}`.
- **Name the combined condition** when merging makes the line unreadable:
  `const isBlockedSender = blockedUsers.length > 0 && !isPrivileged && ...`.
- **Return, `continue` or `break` early.** Invert the outer test and leave, so
  the body that follows is the main path at one level of indentation.
- **Lift the inner block into a named function.** Best when the inner work has
  its own name - `refreshCachedBadges`, `renderUsernameMask`, `asSectionTextRow`.
- **Hoist a callback out of the `if` that wraps it.** An `if` inside a callback
  that is itself inside an `if` still reads as nested; give the callback a name
  at the top of the scope.

Two rules of thumb while doing this. First, an early return has to preserve the
original condition exactly - `if (a) { if (b) X } else Y` is not
`if (a && b) X else Y`, because `a && !b` did nothing in the original. Second,
prefer merging or an early return over a ternary when the branches are
statements; a ternary that assigns JSX or calls two different functions reads
worse than the `if` it replaced.

Guard clauses that sit side by side are fine and are the point:

```ts
if (!cosmetics && cached && ctx.stillCurrent()) {
  deleteCachedUserCosmetics(sevenTvUserId);
}

if (!cosmetics) {
  return null;
}
```

Two shapes deliberately do **not** match the rule. An `else if` chain is flat,
not nested, so it stays as it is. An `if` inside a function declared in the
branch opens its own scope, so it does not read as nested either - though the
"hoist a callback" point above still applies when that function is an inline
callback rather than a named one.

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

Name fixture files after the thing under test, using the pattern `{thing}.fixture.ts`. For example, shared fixtures for the chat hook tests should live in `components/chat/hooks/__tests__/__fixtures__/use-chat.fixture.ts`.

That naming keeps the fixture tied to the surface it supports. A file called `chat-hook-fixtures.ts` sounds like a generic bucket. A file called `use-chat.fixture.ts` says what it exists for and makes it harder to keep adding unrelated test data over time.

The one exception is a fixture the app itself imports. `src/dev/chat-hotspot-bench` runs the perf fixtures on-device from the `dev-tools/chat-perf` route, so those files are part of the app's module graph. EAS strips `__tests__` directories from the build context, so a fixture under `__tests__` resolves locally and then fails the eager bundle in CI with `Unable to resolve module`. Fixtures shared with the bench live in a sibling `__fixtures__` directory _outside_ `__tests__` (for example `src/utils/chat/__fixtures__/resolve-message-emote-tokens.perf.fixture.ts`), and the perf-test imports them with `../__fixtures__/...`. The `no-tests-dir-import` ast-grep rules enforce this.

## Legend State Store Layout

Legend State is unopinionated about folder shape, but we split observables, actions, and React bindings so components do not import `@legendapp/state` primitives directly.

```
src/store/
  chat/
    observables/   # module-level observables (chatStore$, chatTransientState$)
    types/         # shared chat store types and constants
    actions/       # pure mutations against observables (no React hooks)
    react/         # useSelector / useObservable hooks for components
  preference-store.ts # preferences$, persistence, getPreferences and the preference hooks
```

`src/store/preference-store.ts` is the only module that owns `preferences$`, its persistence, `getPreferences` and the preference hooks. Import it directly. Do not add a second module that reads or re-exports the observable: two parallel observables persisted to the same MMKV key desync within a session.

Import chat store modules directly (for example `@app/store/chat/observables/chat-store`, `@app/store/chat/actions/messages`, `@app/store/chat/types/constants`). Do not add barrel exports under `store/chat`.

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

**The chat render path is exempt.** Every font size, line height, emote size and row padding a chat row uses must come from `getChatScale` / `getChatTextStyles` (`components/chat/components/chat-message/util/chat-scale.ts`, `chat-text.styles.ts`), never from a literal at the use site. Density and font scale are two preferences over one ramp; a literal in a renderer silently opts that surface out of one of them, which is the bug the ramp was introduced to fix. Inlining a `lineHeight: 21` in a chat renderer follows the letter of the rule above and regresses the feature.

## Name large parameter types

A function whose single destructured parameter has **four or more members** declares
that shape as a named type above the function. Three or fewer stays inline.

```ts
// avoid
export function SettingsRow({
  title,
  subtitle,
  icon,
  trailing,
}: {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  trailing?: ReactNode;
}) {

// prefer
interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  trailing?: ReactNode;
}

export function SettingsRow({ title, subtitle, icon, trailing }: SettingsRowProps) {
```

An inline shape pushes the whole contract between the parameter list and the body,
so a reader has to scroll past the type to reach the code. It also gives the shape
no name to refer to, so a caller that wants to build the argument, a test that wants
to type a fixture, or a wrapper that wants `Pick<>` or `Omit<>` has nothing to point
at.

Naming follows what the function is:

- A React component gets `interface <Component>Props`.
- A hook or a plain function gets `interface <PascalCaseName>Options`, so
  `useChatLifecycle` gets `UseChatLifecycleOptions` and `getHeartbeatAction` gets
  `GetHeartbeatActionOptions`.

Use `interface`, which is what most of the codebase already uses. Put the
declaration directly above the function, above its JSDoc block if it has one, so
the doc comment stays attached to the function. Export it only when another module
imports it.

This rule is about the size of the shape, not about reuse. A four-member type with
one caller still gets a name. It does not ask you to add members, split a function,
or build a wrapper type for a shape a library already names.

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

Put new module-level observables in `observables/`. Put write helpers that call `.set()` / `.peek()` in `actions/`. Put `useSelector` and `useObservable` in `react/`. Session-scoped state that components subscribe to belongs on `chatStore$`. Hot-path caches that are only read imperatively during ingest or render (mention colours, shared chat badges) are the exception: keep those as plain module-level `Map`s with an explicit size bound and clear function (see `src/store/chat/actions/chat-color-caches.ts`) - routing them through an observable clones and key-diffs the whole bucket on every write. Such caches live in a store `actions/` or chat `util/` module, never inline in a component file. Pure message transforms like `getVisibleMessages` live in `components/chat/util/`. Do not wrap Legend State mutations in `useCallback` unless a React API (imperative ref, effect deps) needs a stable function reference.

## oxlint and the anti-slop rules

`bun run lint:oxlint` runs the local `anti-slop` plugin (`tools/oxlint/anti-slop/`)
and is a separate pass from ESLint. It is a job in both `ci:local` and the
Lint and format workflow, so treat an oxlint error the same as an ESLint one.

`anti-slop/no-module-mocking` is turned off for test files in `.oxlintrc.json`.
React Doctor runs the same anti-slop rules with its own ignore list in
`doctor.config.json` `ignore.files`. To exempt a path, change both files.
The rule is aimed at production code reaching for `jest.mock` instead of a real
seam; in a test file `jest.mock` is the point. Every other anti-slop rule still
applies to tests.

When a rule is genuinely wrong for one line, suppress that line and say why:
`// oxlint-disable-next-line <rule> -- <reason>`. Put it directly above the
reported line, not above the JSDoc block - a comment between the disable and
the code silently suppresses nothing.

## Haptics: react-native-pulsar via the src/lib/haptics.ts wrapper

All haptic feedback goes through the `impact` / `selection` helpers in `src/lib/haptics.ts`, backed by `react-native-pulsar`. The wrapper gates every call on the `hapticFeedback` preference, so importing `react-native-pulsar` directly from a component would bypass the user's setting - `no-restricted-imports` in `eslint.config.mjs` blocks it.

The same rule bans `expo-haptics`, which the wrapper used to sit on. Its Android `Segment_Tick` path resolves an API 34+ `HapticFeedbackConstants` field, so every selection haptic on Android < 14 rejects with a misleading "A haptics engine is not available on this device" error (Sentry FOAM-TV-MOBILE-1R). Pulsar checks device capability (`Settings.getHapticsSupportLevel()`) instead of throwing.

If a surface needs more than impact/selection (richer presets, pattern or realtime composers), add a named helper to `src/lib/haptics.ts` so the preference gate still applies, rather than exempting the call site from the lint rule.

## Chat message identity

`src/utils/chat/message-identity/` owns the one rule for what identifies a chat
message. `getChatMessageKey` composes `message_id` + `message_nonce`,
`getChatMessageStoreId` prefers the store-assigned `id` and falls back to that
key, `getChatMessageListKey` is the list's `keyExtractor`, and
`isRenderableChatMessage` is the validity guard.

All three consumers - the store's dedup index (`store/chat/actions/messages`),
the pre-commit ingest buffer (`components/chat/util/message-buffer`) and the
list - must agree, because `ChatMessagePane` dropped its render-time dedup on
the strength of that agreement. Re-deriving the key locally is how duplicate
rows and broken scroll anchoring get in; add a consumer to the shared module
instead. `get-chat-message-store-id.test.ts` pins the agreement.

Likewise `normaliseChatUsername` (`utils/chat/chat-usernames/`) is the only
login normaliser - it trims, strips a leading `@`, and lowercases. A local
`trim().toLowerCase()` beside it forks the key space for any `@`-prefixed
value.

## Chat body scanning

`src/utils/chat/derive-chat-body/scan-chat-body.ts` walks a message's parts exactly
once and caches the result: whether the body can flow inline, whether it holds
emotes, which notice it is, and who it mentions. `deriveChatBody`,
`getMessageStructure` and `flowsInline` are all views over that one scan.

Inline eligibility in particular used to be written three times, and a new
inline-breaking token kind had to be added to all three. Ask `flowsInline`
(a type predicate, so it also narrows the parts for the inline renderers)
rather than re-testing part types at a call site.

## Chat overlays

Chat sheets live behind `store/chat/observables/chat-overlays` +
`store/chat/actions/chat-overlays`. `ChatOverlayLayer` subscribes to that
observable itself, and the press handlers in `useChatOverlayActions` call the
actions directly, so opening or dismissing a sheet re-renders the overlay
subtree and never the chat root or the message list. Do not lift the overlay
state back up into a hook, and do not return JSX from one.

Hydration scratch state for the visible-asset pass lives in
`store/chat/actions/visible-asset-hydration` for the same reason: it is only ever
read imperatively during ingest, so as React refs it had to be created in an
unrelated hook and drilled two levels to its only consumer.

## Normalising chat strings

Two normalisers, and the distinction is load-bearing:

- `normaliseChatUsername` (`utils/chat/chat-usernames/`) - trims, strips a
  leading `@`, lowercases. For logins, display names, hidden/highlighted users.
- `normaliseChatText` (`utils/chat/normalise-chat-text`) - trims and lowercases
  only. For message bodies, search queries, hidden phrases, highlight phrases.

Running free text through the username normaliser turns a search for `@luke`
into a search for `luke` and silently drops the `@` from a hidden phrase. A
local `trim().toLowerCase()` is a third variant - reach for one of these two.
