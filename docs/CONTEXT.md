# Context: foam domain language

Domain vocabulary for foam, split by area: the GitHub Actions release pipeline
(`.github/` + `scripts/workflows/`), the live-channel domain, and the chat and
emote domain (`src/`). Architecture terms (module, seam, adapter, depth)
follow the `codebase-design` skill. Terms marked ⚠ carry a naming finding -
two names for one concept, or one name for two.

## Release & CI terms

**Variant** — a build flavour: `production`, `internal`, `testflight`, `preview`.
A variant determines its EAS channel, Sentry dist, human release label, and git
tag suffix. The single source of truth is `scripts/workflows/variant.ts`
(table + `sentryDistFor`/`variantLabel`/`appendVariant`/`ignoreTagsPattern`),
exposed to YAML and bash via the thin `variant-cli.ts` entry. Do not re-derive
variant mappings inline in YAML ternaries or bash `case` blocks.

**Deploy decision** — the `auto`/`ota`/`build` choice. In `auto`, a changed native
**fingerprint** forces a native `build`; otherwise an `ota`. Pure logic lives in
`scripts/workflows/otaOrNativeDeployDecision.ts`; the `deploy-ota-or-native.ts`
entry is the side-effecting command dispatcher over it.

**Fingerprint** — `expo-updates` hash of the native layer per platform. Compared
against the previous run's cached fingerprint to decide native-vs-OTA.

**OTA update IDs** — the iOS/Android update IDs from an EAS publish, cached so the
Slack notification can link the previous update.

**Critical OTA index** — a monotonic counter bumped when an OTA is marked critical
(`[critical-ota]` commit tag or the `critical_update` input); the app uses it to
force-apply an update.

**S3 cache** — the release pipeline persists fingerprints, the critical OTA index,
and OTA update IDs in S3 between runs. The store is `scripts/workflows/s3Cache.ts`
(`restoreEntries`/`saveEntries`/`requireBucketName`) behind an injectable
`S3Copier` adapter; `createAwsCopier` is the real `aws s3 cp` adapter, and tests
use an in-memory copier. Path prefixes are built by the pure functions in
`otaOrNativeDeployDecision.ts`.

**Tool runner** — `runTool` in `scripts/workflows/github-actions.ts` is the single
seam for shelling out to `aws`/`eas`. Commands take an injectable `ToolRunner` so
their output-to-GitHub-output wiring is testable with a fake; `getCommandErrorMessage`
is the one shared stderr-extraction helper.

## Live channel terms

**Channel activity** — a broadcaster-driven interactive event surfaced in a
channel's chat (a poll or a prediction): fetched once from Helix for its current
state, then kept live over EventSub. Each activity is described by a
`ChannelActivity` descriptor (`fetch` / `isActive` / `normaliseHelix` /
`events[].normalise`) that the `useChannelActivity` orchestration drives. _Avoid_:
"channel event" (too broad — EventSub carries many non-activity events).

A **Channel activity** is driven by exactly one `useChannelActivity` orchestration;
the orchestration is generic and a descriptor is the adapter at that seam.

**Roomstate** — a channel's chat-mode restrictions from Twitch IRC ROOMSTATE
(slow, followers-only, sub-only, emote-only, unique). The **roomstate tracker**
(`components/Chat/util/roomStateTracker.ts`) owns current state, the diff
baseline, and notice/chip derivation from the single `ROOM_STATE_MODES` table in
`roomState.ts`; `useChatIrcHandlers` feeds it tags and syncs the observable.
Adding a mode is one table entry, not four coordinated edits.

**Channel refresh plan** — the pure freshness decision for a channel's cached
chat resources: full reload vs served-from-cache, and which slices (7TV set id,
subscriber emotes, badges) a served cache still needs. Lives in
`store/chat/actions/channelRefreshPlan.ts` (`planChannelRefresh`);
`loadChannelResourcesInternal` is the side-effecting executor over it, mirroring
the deploy-decision/dispatcher split in the release pipeline.

## Chat domain terms

**Channel (chat-side)** - the Helix entity is `Channel`
(`types/twitch/channel.ts`); the *joined* channel's chat state has no single
type - it is `chatStore$.currentChannelId` plus a per-channel
`ChannelCacheType` in `channelCaches` (bounded by `MAX_CACHED_CHANNELS`) plus
`ChatTransientChannelState`. Join/part are `joinChannel` / `partChannel` on
`useTwitchChat` (`services/twitch-chat-service.ts`). ⚠ "channel" names both
the Helix entity and the chat room; the joined-channel concept has no home
module.

**Stream** - `TwitchStream` (`types/twitch/stream.ts`), the live broadcast as
distinct from the Channel that persists offline. ⚠ UI surfaces say
`LiveStream*` (`LiveStreamScreen`, `LiveStreamCard`) but render
`TwitchStream`; no `LiveStream` type exists.

**Chat message** - `ChatMessageType<TNoticeType, TVariant>`, workhorse alias
`AnyChatMessageType` (`store/chat/types/constants.ts`): `userstate`,
`message: ParsedPart[]`, `seq`, `committedAt`, `isHistorical`. IRC command
variants are the `NoticeVariants` union (`usernotice`, `clearchat`,
`clearmsg`, `roomstate`, `notice`, `userstate`, `globalusernotice`), typed
per command in `types/chat/irc-tags/`; USERNOTICE sub-variants (`sub`,
`raid`, ...) are `TwitchNotices`. ⚠ `BufferedMessage`
(`components/Chat/util/bufferedMessageOps/`) is the same entity pre-commit
(plus `cachedSenderColor`).

**Tags** - IRCv3 metadata. `parseIrcTags` (`utils/chat/ircProtocol/`) yields
a plain string record with no named type; named shapes exist only
post-coercion as the `*Tags` interfaces (`UserStateTags`, `RoomStateTags`,
...). `parseIrcMessage` is the line parser.

**Part** - the parsed span within a message body:
`ParsedPart<PartVariant>` (`utils/chat/parsedPart.ts`) - `text`, `emote`,
`mention`, `stvEmote`, `twitchClip`, `link`, `cheermote`, and notice parts.
_Avoid_: "token" (unused in code). ⚠ two variants name provider emotes: the
main resolution paths (`processEmotesWorklet`, `replaceTextWithEmotes`) emit
`'emote'` for every provider, while the word/link parse path
(`parseWordLinkParts`) emits `'stvEmote'` - pinned by
`emoteResolutionDivergence.test.ts`; the `parsedPart.ts` doc comment saying
`'emote'` means a unicode emoji has drifted from reality.

**Buffer** - three holding areas, in order: the **delay queue**
(`components/Chat/util/chatDelay/chatDelayQueue.ts`, max 1000), the
pre-commit **`MessageBuffer`** (`components/Chat/util/messageBuffer.ts`,
dedup index, injectable bound), and the committed window
`chatStore$.messages` (150 via `getMaxChatMessages`, trimmed by
**front-trim**).

**Channel session** - the span between joining and leaving a channel's chat.
It ends through exactly four triggers - `leave` (navigation beforeRemove),
`unmount`, `switch` (in-place channel change), `part` (IRC PART echo for the
current room) - and `resetChannelSession(trigger)`
(`store/chat/actions/channelSession.ts`) is the one owner of the
module-level resets each trigger requires. Hook-armed resources (scroll
timers, buffers, socket refs) are released by their arming hooks, never
here.

**Ingest** - raw line to committed message. The stage names are the perf
marks: `line_received` → `buffered` → `drained` → `committed`
(`lib/chatPerfMarks.ts`). Verbs: the buffer **drains**, the cadence
(`components/Chat/util/chatFlushCadence/`) **flushes**, the store write
(`addMessages`, `store/chat/actions/messages.ts`) **commits**. Front-door
rate limiting is `chatIngestRateLimiter`.

**Ingest controller** - the headless ingest state machine
(`components/Chat/util/chatIngestController.ts`): buffer, delay queue, flush
cadence, raid latch, backpressure, unread accounting and moderation
coherence behind one factory. `useChatMessages` is its React lifecycle
adapter; jest drives a raw line into the real store through it with fake
timers.

**Enrichment** - post-commit emote/badge re-resolution over already-parsed
messages (`store/chat/actions/messageEnrichment.ts`: `enrichMessageSet`,
`enrichVisibleMessage`). Parse-time resolution is **processing**
(`emoteProcessor.ts` / `resolveMessageEmoteParts`). The two words are
deliberate - keep them distinct.

**Message identity** - `utils/chat/messageIdentity/`: `getChatMessageKey`,
`getChatMessageStoreId`, `getChatMessageListKey`, `isRenderableChatMessage`.
The one rule for what identifies a message; buffer, store dedup index and
list keyExtractor agree (see AGENTS.md).

**Userstate / room state** - the authenticated user's chat state is
`UserStateTags`, held imperatively in `twitch-chat-service.ts` behind an
external-store revision (`subscribeUserState`); the channel's mode state is
**room state** (`RoomStateTags` → `ParsedRoomState`, tracked by
`createRoomStateTracker` in `components/Chat/util/roomState/`). ⚠
`ChatMessageType.userstate` is the *sender's* per-message tags - same word,
different concept from the user's own USERSTATE.

## Emote & cosmetics terms

**Emote** - `SanitisedEmote` (`types/emote.ts`), a per-provider union over
`SanitisedEmoteBase`; carries `zero_width` and `image_variants`
(`animated` / `static`). ⚠ `ProviderSanitisedEmote`
(`services/emote-provider.ts`) is a near-identical service-layer
intermediate - two shapes for one glyph.

**Emote collection / emote set** - ⚠ dual naming, both live: ingest says
**collection** (`EmoteCollection`, `getBaseCollectionKey`,
`baseCollectionCache`, content-hash `getEmoteContentId` - all in
`emoteProcessor.ts`) for the resolved per-channel lookup; providers and the
7TV wire say **emote set** (`getSanitisedEmoteSet`, `emote_set.update`) for
the fetched unit.

**Emote provider** - ⚠ absent as a seam. Per-provider service modules
(`seventv-service.ts`, `bttv-emote-service.ts`, `ffz-service.ts`,
`twitch-emote-service.ts`) share only the sanitiser (`buildSanitisedEmote`
behind `EmoteProviderSource`); dispatch is scattered `site ===` string
checks on `EmoteSite` display strings across ~8 files. ⚠ 7TV is spelled four
ways: `seventv` (paths), `sevenTv` (values), `SevenTv` (types), `stv`
(part variants, `StvUser`).

**Badge** - `SanitisedBadgeSet` (`types/twitch/badge.ts`) is the
cross-provider badge type despite its path; resolved by `findBadges`
(`utils/chat/findBadges.ts`) from userstate plus per-provider inputs. 7TV
badges bypass `findBadges` and arrive via cosmetics (`chatStore$.badges`).

**Cosmetics** - the umbrella for 7TV paints, badges and entitlements
(`store/chat/actions/cosmetics.ts`, `cosmeticsBridge.ts`; types in
`types/seventv/cosmetics.ts`: `PaintData`, `PaintLayerData`,
`Entitlement*`). Rendered by `components/ChatMessage/CosmeticUsername/`
(`PaintedUsername`).

**Tick** - two shared animation pulses, one per domain: native animated
emotes on iOS ride `SharedAnimationDriver` (one `CADisplayLink` + global
epoch, added by the expo-image patch); Skia paint animation rides
`sharedPaintAnimationFrames.ts` (one Reanimated `useFrameCallback`, paused
by `chatScrollActiveShared`). ⚠ No `SyncedAnimationCoordinator` exists, and
Android has no shared tick - Glide restarts each emote from frame 0
(ADR-0009).

**Session** - the chat connection lifecycle (`useChatSession`;
`useChatSurface` is the render-surface half, `useTwitchChat` the IRC
connection under both). _Avoid_: "session" for auth - the authenticated
identity is `AuthContextState.user: UserInfoResponse` and no auth Session
type exists.

## App mechanisms

**Fetch-once guard** — the single-flight + negative-cache + TTL + generation-fence
mechanism behind session-scoped resource fetches
(`src/utils/async/fetchOnceGuard.ts`). The guard owns *mechanism* only; stamping
policy and value storage stay in each adapter. Adapters: channel cheermotes
(`utils/chat/cheermoteStore`), 7TV personal emotes and Twitch subscriber channel
profiles (`store/chat/actions/channelLoad`), 7TV user cosmetics
(`store/chat/actions/cosmetics`). `clear()` fences in-flight fetches: their
`stillCurrent()` turns false and `markFetched` no-ops, so a completing fetch can
never re-poison a freshly cleared cache. Do not hand-roll in-flight Sets or
attempted-id negative caches next to a new fetch path; instantiate a guard.

**Message interpreter** — the pure decision layer for a stateful message
bridge: given a parsed inbound message plus a snapshot context of what the
decision actually needs, it returns typed decisions/actions; the owning hook
executes them (store writes, callbacks, timers, logging). Instances: the 7TV
EventAPI interpreter (`utils/seventv/seventvWsInterpreter.ts`, executed by
`hooks/useSeventvWs`) and the player bridge interpreter
(`components/StreamPlayer/util/playerBridgeInterpreter.ts`, executed by
`usePlayerBridge`). Decision logic goes in the interpreter, never back into the
hook's message handler.

## Decisions

See `docs/adr/` — notably ADR-0004 (the role-scoped 1Password secret loaders
stay separate for least-privilege), ADR-0005 (Legend-State vs TanStack Query
ownership rule), ADR-0006 (patches, not forks - the patched surface is
off-limits by default), ADR-0007 (LegendList is the chat virtualizer),
ADR-0009 (one shared animation tick per domain), and ADR-0010 (chat ingest
perf invariants outrank depth).
