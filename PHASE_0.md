# PHASE_0 - Mine what is already solved (2026-08-10)

Sources: `.agents/skills/foam-chat-performance-audit/` (SKILL.md + 4 references), AGENTS.md, ast-grep rules, `docs/tech-debt-register.md`, `docs/adr/0001`, `docs/perf-audit-fixes-2026-07-10.md`, full perf git-history mine (929 commits), instrumentation sweep, native frame-sync read, chat hot-path map, and prior-session memory of reverted attempts.

## 0. Corrections to the campaign brief

The brief's assumptions differ from the repo in ways that change the plan:

- **The chat list is LegendList** (`@legendapp/list` 3.3.3 + repo patch `#860`), not FlashList. FlatList is banned by ast-grep. "FlashList configuration" maps to LegendList config, and the audit skill says its comments have lied before - the installed source in `node_modules` is the truth.
- **There is no `SyncedAnimationCoordinator` module.** Frame sync is an 848-line patch to expo-image (`patches/expo-image@57.0.1.patch`, `SharedAnimationDriver.swift`), landed in #857, iOS only. The fps cap is **30**, not 15 - 15 is only the `CAFrameRateRange` floor.
- `sampleLiveCommit` and `pretextChatHeight` do not exist. The equivalents are `shouldProcessLiveMessage` (`src/utils/chat/chatIngestRateLimiter.ts` - 150 msg/s token bucket, burst 30, applied pre-parse at the socket) and `CHAT_ESTIMATED_ITEM_SIZE = 26` plus per-item-type size averages partitioned by `chatRowSizeBucket` (#862).
- **React Compiler is ON.** The brief's "no speculative memo" rule is stronger here: any manual-memo finding is noise unless a compiler bailout is demonstrated through `babel-plugin-react-compiler`.
- The repo carries its own audit constitution: `.agents/skills/foam-chat-performance-audit/` has budgets, a forbidden-findings list, and a **ranked open frontier (F1-F8)**. This campaign inherits it; re-reporting a forbidden finding fails the audit.
- **Phase 1 of the brief is mostly already built** (section 3).

## 1. Non-negotiable constraints found in-repo

- Budgets: 8.33ms/frame on ProMotion iPhones, 16.67ms on 60Hz and all Android; JS thread AND main thread must each fit. Sustained: no over-budget frame for 60s at 40+ msg/s.
- "Foam wins on work avoided, not per-unit speed." Rank by ceiling, not ease. P0/P1 findings need a number; otherwise P3 `unverified`.
- Fix-proving: one item at a time, narrowest change, same harness/device - **if the number did not move, revert**. Anything touching gestures/scroll/recycling also needs `bun run e2e:test:smoke`.
- `sample()` on the simulator is dev-build directional evidence only; close the React DevTools daemon before sampling (measured inflation: JSON 8.9%→2.6%). Reassure noise floor is 20-30% - do not launder "under the noise floor" into a win.
- The signpost tracing module is iOS-only; never present an iOS number as an Android number. Android is structurally untestable in jest (`defaultPlatform: 'ios'`, tech-debt #31).
- Chat render path: every font/emote/row size comes from `getChatScale`/`getChatTextStyles` - never a literal.
- Hot imperative caches stay plain module Maps with a size bound (observables clone + key-diff the bucket per write). Message identity has one source (`utils/chat/messageIdentity/`) - the list dropped render-time dedup on that agreement.
- Image rules: `prefetchToDisk` is the only prefetch entry point ('disk', never 'memory-disk'); four image caches deliberately share no coordinator (ADR-0001); `clearImageCache` must clear all four.
- A finding inside a patched package must state whether the patch is implicated. A constant with a rationale comment is a settled, measured decision - do not chase it.

## 2. ALREADY SOLVED - the brief's Phase 3 suspects vs reality

Reporting any of these as findings fails the audit.

| Brief suspect               | Status in repo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Ingest batching          | **Solved.** Pre-parse token bucket (150/s, burst 30) → 1000-cap dedup buffer with bounded `drain(limit)` (over-limit stays buffered, not dropped) → adaptive flush (100ms live / 250ms scrolled / 180ms raid, per-flush commit caps 4-15 by platform/mode) → `startTransition` commit. Backpressure at 400 flushes immediately; scroll defers flushes 250ms; drops reported to Sentry (`chat.pipeline.messages_dropped`). The 100ms cadence cut app CPU ~40% (#594) - do not lower it before tree-cost work lands. |
| B. Parse-once               | **Solved.** Parse-at-commit (`finalizeBufferedMessage`); 1000-entry emote parse cache keyed on collection identity + text (with `getEmoteContentId` interning so scoped-array rebuilds still hit); `scanChatBody` WeakMap - one walk per message, all views derive from it; badge normalisation WeakMap (measured -74%); `Intl.Collator` hoisted (#804).                                                                                                                                                           |
| C. Message identity         | **Solved.** `Map`-indexed buffer with in-place merge; `appendToMessageWindow` slices before concat; incremental index maintenance instead of full rebuilds; stable `keyExtractor` via `getChatMessageListKey` with WeakMap fallback for malformed rows. No splice-per-message anywhere.                                                                                                                                                                                                                            |
| D. Legend-State granularity | **Solved by design.** Leaf `useSelector` subscriptions; `MentionSpan`/`UserChatBody`/`PaintedUsername` self-subscribe; `mentionLoginRevision` deliberately excluded from `extraData` (~57fps → flat 60); paint bindings must not bump `cosmeticBindingsVersion` (pinned by `cosmeticsChurn.test.ts`). Note: Legend State never notifies on equal-content sets, so notification counting is an invalid measure (documented discard).                                                                                |
| E. List config              | **Solved except F1.** `getItemType` = content-width buckets × emote suffix (18 effective types, #862); `drawDistance` 250; estimate 26 (deliberately under); MVCP/`maintainScrollAtEnd` mutual exclusivity; render-range patch (#860); front-trim suspension while scrolled (headroom 350). `recycleItems: false` is a crash workaround - the frontier item is fixing the crash (F1), not flipping the flag.                                                                                                       |
| G. Emote pipeline           | **Largely solved (iOS).** Shared CADisplayLink driver, global epoch, 30fps cap, 24MB/image + 96MB total preload budgets, LRU + memory-warning release; recycle deregisters via `recyclingKey didSet`; row-visibility + scroll-activity pause; decode caps (4/8 by tier); warm-pass excludes animated; picker capped at 96 slots; no per-emote timers anywhere. Gaps are in section 4.                                                                                                                              |
| Backpressure policy (A)     | Exists and is deliberate: bounded drain + cap re-arm, drop only at the 1000-cap with Sentry reporting. #863 (HEAD) just fixed the pipeline dropping usernotices.                                                                                                                                                                                                                                                                                                                                                   |

Also forbidden by the audit skill: adding `useMemo`/`useCallback`/`React.memo`, StyleSheet extraction ("the cost is array length, not object identity"), switching to FlashList, capping scrollback, off-thread JSON, anything in `__tests__`/`.stories`/`src/dev/**`.

## 3. PARTIALLY SOLVED

### Measurement harness (brief Phase 1) - ~80% built

Exists:

- Deterministic synthetic IRC flood through the **real** ingest→parse→buffer→commit→render path (`useChatSession` `syntheticTransport` skips IRC/EventSub/backfill, feeds the same `onMessage`). Byte-identical replay per window (`resetFloodReplay`). Presets: steady60 (60/s), burst (80/s + 40), raid (120/s + 80).
- On-device suite (`useChatPerfSuite`): warmup 5s → measure 15s → cooldown 4s per phase; JS-thread rAF counter (jank >33ms) + UI-thread Reanimated worklet counter (jank >25ms, countdown on UI thread); results to `Documents/img-bench.json`; signpost intervals bracket windows; live HUD overlay (js/ui fps, jank, cpu%, mem).
- Reassure: 11 `*.perf-test.ts` + CI gate (`.github/workflows/chat-performance.yml`, worktree baseline, sticky PR comment). `chatHotspotBench` microbenches share the Reassure fixtures.
- Host scripts: `scripts/perf/capture-chat-instruments.sh` (sim=`sample`, device=xctrace), react-devtools capture/diff scripts, deep-link params `?flood=<preset>&suite=1` for scripted runs.
- Production telemetry: Sentry traces 0.15 + auto TTID, image spans with 5s deadline, `chat.pipeline.messages_dropped`, memory-pressure trims + breadcrumbs.

Gaps (this is Phase 1's real scope):

- Corpus is 118 messages - no sub notices, cheers, replies-at-density, unicode + zero-width stacks the brief specifies.
- **No `performance.mark`/`measure` anywhere** - the brief's "IRC received → Fabric commit" latency metric has no instrumentation. (`react-native-performance@6.0.0` is installed and never imported.)
- No automated device-driving flow (deep-link params exist; nothing drives them in e2e).
- No Android story: no Perfetto/Flashlight script, no gfxinfo capture, no Android frame-health numbers at all.
- No production frame-health telemetry (all fps/jank counters are dev-only).
- CpuUsageModule has one consumer (dev overlay); no thermal reading; nothing wires CPU/thermal into degradation.

### Animation (iOS solved, Android not)

- **Android has no shared driver at all** - no Choreographer port, no fps cap, no phase lock, and Glide restarts every animation from frame 0 on resume (`ExpoImageViewWrapper.kt:173`), so every visibility toggle/fling settle desyncs all emotes. This is the single biggest untouched platform gap.
- Animated 7TV paints tick on a **second, independent clock**: per-subscribing-component `useFrameCallback` (`sharedPaintAnimationFrames.ts:132`) - N painted rows = N worklet invocations per frame (decode shared, tick registration not). No global epoch.
- Chat inline emotes have no concurrency cap - past the 96MB budget, views silently fall back to unsynced per-view players.
- Offscreen driven views stay registered in the driver's hash table (JS `stopAnimating` is the first line of defence).

### Cold start / TTI

- Done: barrel imports removed, persisted chat blob halved (#855), optimistic anon auth, expo-image cache config iOS-gated (#789), `console.timeStamp` perf-tracks kill, InteractionManager removed.
- Not done: **logged-in `doAuth` still blocks first frame** (known-unsolved); no measured startup breakdown exists anywhere (no app-start profile artifacts); bundle: Atlas workflow exists and named **Apollo + Sentry as the next big wins** - unexecuted; `enableFreeze(false)` is global (#824) where per-screen `freezeOnBlur` is the documented preference - deliberate at the time, worth re-measuring.

## 4. KNOWN-BUT-UNSOLVED - the in-scope worklist

Ranked frontier from the audit skill (inherit this ranking):

- **F1** Recycling off - fix the crash (row state outliving recycle; `ChatInlineImage` recyclingKey races). "Usually the largest single structural gap in a list."
- **F2** Paint `native` renderer mounts ~25 native views per painted username; scroll-shed unmounts/remounts that subtree every fling; `webview` renderer unreachable in prod (~350 dead lines, tech-debt #24).
- **F3** Design-system `Text` compiles to `_c(79)` per instance and walks style arrays recursively; 4+ per chat row with fresh style-array identities.
- **F4** Ingest object churn - `prepareMessagePartsForStore` clones every part + `Object.defineProperty`; 7 whole-message spreads IRC→store; add-then-`delete` of `pendingEmoteParse` forces Hermes dictionary mode; cloning breaks parse-cache identity downstream.
- **F5** 7TV `emote_set.update` re-walks the whole window and invalidates the entire parse cache via array-identity keying (~800ms sustained).
- **F6** `ChatRow` Surface style array: 18 entries, 16 static-or-false, 17-way compare per row render.
- **F7** Scroll/touch on JS - `chatScrollActivity.poke()` re-arms a timer per scroll event (~60/s); per-row `onTouchMove`; 650ms JS long-press timer fires late under load.
- **F8** Commit-path memo gaps - `findBadges` uncached across a chatter's messages, `extractEmotesFromTag` uncached, `parseIrcMessage` re-scans, `getChatMessageKey` computed 4x per commit, `shiftMessageIndexes` rewrites both Maps per trimming flush.

From `docs/perf-audit-fixes-2026-07-10.md` (open): `cosmeticsBridge` clones 3x ~2000-entry maps per entitlement event (**note: `cosmeticsBridge.ts` is modified in the current working tree - may be in flight**); alternating-row stripe keyed to list index; reply-quote/sub-notice render-time full parse; `parseIrcTags` allocations; `Image.tsx` double-decode on disk-cache swap; `emoteProcessor` `baseCollectionCache` cap 64 pins tens of MB (drop to 2-4); cosmetics persist sync stringify. Sentry follow-ups: `estimateRefBytes` p75, `getActiveSubscriptions` 250ms p75, `getSanitisedChannelBadges` 92ms p75.

Tech-debt register: #34 `ChatOverlayLayer` 60-prop pass-through + 45 manufactured `useCallback`s; #37 `chatStore$` imported raw in 19 files (over-broad subscription risk); #30 twemoji (unmaintained, on the render path); P0 emote-sheet WebP hang risk.

## 5. UNEXPLORED

- **Shadow-node census per row type** - nobody has counted; the brief's suspect F escalation (flatten → collapse text runs → native Fabric row) is untouched and is where the multi-fold render win would live if JS is already tight.
- **Android everything**: synced animation driver, Perfetto/Flashlight baseline, frame-health numbers.
- Cold-start breakdown measurement (native init, Hermes, first commit) - zero data today.
- TanStack structural-sharing cost on large payloads (streams lists, emote sets); no query-per-chat-row violations are known, but nobody has audited.
- Combined player + chat load benchmark (the brief's suspect J) - player telemetry exists but no joint protocol.
- CPU/thermal-watermark animation degradation (modules exist, unwired).

## 6. Prior failed/reverted attempts - do not re-propose without new evidence

- nitro-fetch HTTP swap → reverted to axios (no reason recorded; client since replaced again).
- Worklets `bundleMode` → black-screened v1.0.4 silently (no ErrorBoundary/Sentry); re-enable is an unscored backlog item requiring on-device smoke.
- Nitro image renderer → removed; its removal itself was the perf win (raid js-fps 26→57). expo-image is the sole emote/badge renderer.
- Observable-bound list rows → investigated, not feasible.
- Threaded chat runtime (second JS runtime) → POC works, blocked by Firebase `use_frameworks` static linking.
- Single-decode image path → reverted.
- Emote ref watchdog + badge tint (#840) → reverted; the ref problem was re-solved structurally (#853/#854).
- Message-cap removal (`902299f5`) → deliberate memory regression for correctness; memory re-fixed differently (#855).
- iOS native-feel overhaul → backed out for a duplicate `react-native-screens` in the lockfile; re-landed deduped. Lesson: lockfile dup check after native-dep churn.
- Staggered per-message `setTimeout` flood feeder → measured worse than the 100ms-tick batch (180 timer fires/s of harness overhead).
- Legend State notification counting as a re-render measure → invalid (equal-content sets never notify).
- Draining the websocket send queue on open → stale command replay.
- xctrace on simulator → hangs/records nothing; `sample()` fallback only. Raw `xcodebuild` Release sim builds crash - use EAS (`DISABLE_EAS_BUILD_CACHE=1` when iterating native patches).
- react-native-boost beyond View flattening → can't touch text cost (text cost remains the open ceiling, cf. F3).

## 7. Working-tree caution

The tree has a large uncommitted diff (37 files, +758/-433) across chat hooks, cosmetics bridge, painted-username components, and fixtures - in-flight work that must be landed or stashed before any baseline is captured, or every measurement diffs against a moving target. Separately: this session reverted codex's `TurboModuleRegistry.getEnforcing('RNPulsar')` change in `src/lib/haptics.ts` (back on `Presets`); codex's `react-native-device-info` deep-import in `index.js` is still present.

## 8. Verdict

Phase 1 shrinks from "build the harness" to "fill four gaps": stage-timing marks behind a perf flag, a richer replay corpus, an automated device-driving flow, and any Android capture path. Phase 2 profiling should start from the F1-F8 frontier, not from scratch - F1 (recycling), F3/F6 (text + style-array cost), F4 (ingest churn) and the Android animation gap are the candidates with multi-fold ceilings. Stopping here for review per the campaign brief.
