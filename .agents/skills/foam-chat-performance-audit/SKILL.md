---
name: foam-chat-performance-audit
description: >-
  Deep performance audit of Foam's chat surface - the full ingest → parse →
  buffer → commit → layout → paint pipeline - targeted at winning on sustained
  frame rate during floods, raids and flings. Repo-specific fork of the
  hot-path-perf method: the derivation, harness commands, harness workarounds,
  already-solved list and ranked frontier are baked in. Use when chat janks,
  when asked to make chat faster or audit chat performance, or before merging
  changes to the chat render or ingest path.
license: MIT
compatibility: >-
  The Foam repo (React Native + Expo, bun). Needs shell access; iOS
  measurement assumes a booted simulator with the dev build installed, or a
  physical device for Instruments.
metadata:
  version: '1.0.0'
  derivedAt: '2026-08-07'
---

# Foam Chat Performance Audit

**Foam cannot win on per-unit speed. It has to win on work avoided.**

Foam pays for JavaScript execution plus a Fabric commit plus native layout on every batch of messages; per message rendered, other clients can be faster and that will not change. The winnable game is doing less per message - and this pipeline has already taken most obvious wins, so the default failure mode of an audit here is re-reporting solved problems. Everything below is filtered through the already-solved list; check it before writing anything down.

Two rules from the parent method still govern:

1. **Measure before reading.** A finding without a before-number is a guess with a file path attached.
2. **Rank by ceiling, not by ease.**

## Derived repo facts (re-derive if these look stale - see references/derivation.md)

- **Toolchain:** bun. Scripts: `bun run ts:check`, `bun run test`, `bun run test:perf` (reassure), `bun run lint:ast-grep`, `bun run e2e:test:smoke`.
- **Framework:** React Compiler ON (`app.config.ts` `experiments.reactCompiler`), New Architecture, Hermes. Manual memo findings are noise unless you show a compiler bailout - compile the file through `babel-plugin-react-compiler` for ground truth; it names bailouts (e.g. `??=` is unsupported) and emits per-instance `_c(n)` cache sizes you can rank by.
- **Surface stack:** LegendList (check installed version in `node_modules/@legendapp/list/package.json` - config comments have described other versions' semantics; the installed source is the truth). `recycleItems` ON (`ChatList.tsx`, `CHAT_RECYCLE_ITEMS`); ADR-0007 lists the row state that resets per message. Legend State with leaf subscriptions; hot imperative caches are plain module Maps by design (see AGENTS.md). Ingress is raw IRC over WebSocket. Reanimated 4 + worklets available; scroll/touch on the chat path are still JS-thread refs and timers.
- **Patched deps:** `patches/` carries expo-image (15fps animated cap, shared CADisplayLink), @expo/ui, and @legendapp/list (render range projection, list height as state - F10). A finding inside a patched package must state whether the patch is implicated.

## Budgets

| Target | Budget | Applies to |
| --- | --- | --- |
| 120fps | 8.33ms | ProMotion iPhones - the scroll bar to judge by |
| 60fps | 16.67ms | Everything else, all Android test devices |
| Sustained flood | No frame over budget for 60s at 40+ msg/s | The scenario that separates clients |

JS thread and main thread each get the full budget and both must fit.

## Harnesses, and their measured state

| Command | Measures | State (2026-10-17) |
| --- | --- | --- |
| `bun run test:perf` / `bunx reassure --testMatch "**/<name>.perf-test.*"` | JS duration + render counts vs baseline | Works. For uncommitted changes use the stash-baseline protocol in references/measurement-recovery.md. Duration stability is 10-35%; allocation wins may not reach significance - report that honestly. |
| `bun run argent:perf:suite` | 2-minute medium + heavy synthetic chat; Flashlight FPS/CPU/RAM + in-app ui-fps/jank/mem/cpu | Android (Argent ≥0.27, Flashlight). Debuggable build to pull `chat-perf-suite.json`. `bun run argent:perf:suite:report -- bench-results/chat-suite.json bench-results/chat-suite-app.json`. Leak if RSS slope ≥ 8 MB/min. Short benches: `bun run argent:perf`. |
| `bun run perf:chat:rn` | React DevTools profile (slow components, rerenders) | Broken on RN 0.88 (2026-11-14): `setUpReactDevTools.js` only connects through Fusebox, so the app never dials the daemon on port 8097 and `wait --connected` hangs. Workaround: start the daemon, find the module that exports `connectToDevTools` (`__r.getModules()` is a `Map`; it was id 218), then run `__r(218).connectToDevTools({host: 'localhost', port: 8097})` through `argent run debugger-evaluate --port <metro port>`. Then profile by hand. Also, order matters: Metro must be alive (`curl localhost:8081/status`), the DevTools daemon must be listening before app launch, and a stale agent-device session must be closed first. The script's first `wait --connected` hangs if the app predates the daemon - terminate/relaunch the app, then drive the steps manually. Suite: `FOAM_CHAT_DEEPLINK='foam://dev-tools/chat-perf?suite=1' FOAM_RN_PROFILE_SECONDS=600 bun run perf:chat:rn`. |
| `bun run perf:chat:ios` | Time Profiler (device) / `sample` call stacks (simulator) | Works. The script auto-detects simulators and uses `sample` on the host process because xctrace records nothing against a sim (empty bundle, `Document Missing Template Error` on export); it prints a hotspot summary and writes `.sample.txt` + `.summary.txt`. Simulator numbers are dev-build directional. Set `FOAM_FORCE_XCTRACE=1` to retry xctrace after an Xcode update - the script now detects and reports the empty-bundle case instead of hanging. Suite: `FOAM_CHAT_DEEPLINK='foam://dev-tools/chat-perf?suite=1' FOAM_INSTRUMENTS_SECONDS=600 bun run perf:chat:ios`. |
| `dev-tools/chat-perf`, `dev-tools/image-benchmark` | On-device synthetic flood + live CPU overlay; `?suite=1` runs the 2-minute suite | dev/internal/e2e variants only. |

Live scenario used for captures: `foam://chat?channelId=71092938&channelName=xqc` (see `scripts/perf/capture-chat-*.sh` for the env knobs: `FOAM_IOS_UDID`, `FOAM_CHAT_CHANNEL_ID`, `FOAM_INSTRUMENTS_SECONDS`).

Reference numbers from the 2026-08-07 audit (dev build, sim, steady-state live xqc): JS thread ~7% busy, GC ~2.5%, per-flush pane re-render at the 10/s flush cap; the visible CPU was vImage emote decode and software H.264 off the JS thread. Steady state is healthy - the findings live in flings, bursts and tail events.

Synthetic flood numbers from 2026-11-14 (`perf/emote-processor-learnings`, dev build, sim, `sample`, % of one core): JS thread 56% busy at medium (60 msg/s), 97% at heavy (120 msg/s plus bursts), 64% over the suite. GC is 7-10% of the JS thread on a fresh app and grows with session age (F11). Emote decode is libwebp (`GetCoeffsFast`, `VP8ParseIntraModeRow`) plus CoreGraphics resampling on the expo-image `NSOperationQueue`, 29% (medium) to 69% (heavy) of one core spread over many threads, not vImage. The main thread is 16-30% busy: Fabric mount 6-9%, Core Animation 4-7%, expo-image `finalizeUpdates` and `ExpoFabricView.create` 2-5%. These floods are much heavier than live xqc, so do not compare them with the 7% figure above.

## The pipeline ledger

| # | Stage | Code | Already mitigated by |
| --- | --- | --- | --- |
| 1 | Socket receive | `services/twitch-chat-service.ts`, `hooks/useSeventvWs.ts` | - |
| 2 | IRC parse | `utils/chat/ircProtocol/**`, `utils/chat/messageHandlers/**` | token bucket consulted first (drop-first, verified) |
| 3 | Ingest gate | `utils/chat/chatIngestRateLimiter.ts` | 150/s bucket 30 |
| 4 | Buffer | `Chat/util/messageBuffer.ts`, `Chat/hooks/useChatMessages.ts` | arrival buffer + delay queue |
| 5 | Emote/badge parse | `resolveMessageEmoteParts.ts`, `emoteProcessor.ts`, `findBadges.ts` | 1000-entry parse cache (collection identity + text), deferred to commit |
| 6 | Store commit | `store/chat/actions/messages.ts` | `startTransition`, 150 cap, per-flush commit cap, slice-before-concat window |
| 7 | React render | `useChatRowRenderer.tsx`, `ChatRow.tsx`, `RichChatMessage.tsx` | React Compiler |
| 8 | Fabric commit + layout | LegendList in `ChatList.tsx` | 100ms flush cadence (issue #594) |
| 9 | Paint | `ChatInlineImage.tsx`, `CosmeticUsername/**` | refcounted emote cache, pressure eviction, shared animation clock, paint bitmap LRU |

## Fan out the deep read

One context cannot hold this pipeline at audit depth. Decompose into parallel read-only subagents - the 2026-08-07 split that worked: (1) row render path, (2) paint/cosmetic path, (3) scroll + touch, (4) list-level allocations, (5) ingest stages 1-5. Rules:

- Every prompt embeds the already-solved list below as forbidden output.
- Demand `file:line`, what runs, how often, fix shape, ceiling. No location, not admissible.
- Require reading installed library source in `node_modules` over trusting config comments.
- Where memoisation is in question, compile the file through the real React Compiler.
- Findings come back `unverified`; the main context reconciles them against harness numbers.

## Already solved - forbidden output

Reporting these fails the audit. If one is genuinely wrong in a specific place, cite file:line and why that instance is the exception.

| Do not report | Why |
| --- | --- |
| Add `useMemo`/`useCallback`/`React.memo` | Compiler on; show a bailout or drop it |
| Batch/debounce/rate-limit messages | Buffer, `pickFlushDelay`, commit caps, raid mode, token bucket all exist |
| Cache the emote parse | `emoteProcessor` caches; so do base-collection and scoped lookups |
| Cache badge normalisation | `normalizeSevenTvBadge` is WeakMap-cached (measured -74%) |
| Cap the scrollback | 150, user-configurable |
| Defer parsing off ingest | Done - `finalizeMessageForCommit` |
| `startTransition` the commit | Done |
| Off-thread JSON | `lib/off-thread-json/**` |
| Move parse, tokenize or collection builds off the JS thread (worklet Worker runtime, JSI or Nitro tokenizer) | Evaluated 2026-11-13, rejected (local report `.claude/perf/offthread-evaluation.md`). Stages 1-5 cost ~10.5µs/msg on V8 `--jitless` (Hermes proxy), so 0.16% of the JS thread at the 150/s cap. Moving a 150-message token batch costs as much as tokenizing it, or more: `structuredClone` 0.27-0.30ms against a 0.15-0.23ms tokenize on JIT engines, and worklets serializes in JS plus JSI, not natively. Token identity does not survive the copy. A native tokenizer saves 7µs/msg at most and must mirror the emote set into C++ on the JS thread. The emote Map build is <1ms and its copy is 15-20x that |
| FlashList / `estimatedItemSize` | LegendList is deliberate; estimate set; FlashList's `useMappingHelper` was removed from chat as dead weight |
| Extract inline styles to StyleSheet | Already are - the cost is array length (see frontier) |
| Lower the flush interval | Not before tree-cost work lands; re-measure GC after (issue #594) |
| Flip `recycleItems` on | Done (ADR-0007). Device fling QA is still open |
| Window trim copies | `appendToMessageWindow` slices before concatenating |
| `__tests__`, `.stories`, `src/dev/**` | Not in the production graph |

## The frontier (as audited 2026-08-07 - full findings in `.claude/perf/`)

Ranked by ceiling. Verify each still exists before working it; the tree moves.

**High ceiling**

- **F1 - Recycling.** On since 2026-11-13 after simulator fling QA (ADR-0007). Open: on-device fling QA at 60Hz and 120Hz. Any new row state keyed to one message must reset when the message changes.
- **F2 - Painted username render cost. LANDED 2026-11-13** (`ca2c36f`, `ae68565`, `04f7c63`, `0aee90e`; perf test `c45b68c`). `skia` was already the default flag (`paintRendererFlag$`, Remote Config can still pick `native` or `off`). Moderated rows now draw with Skia: the rasterizer draws the line-through with the glyph paint at Montserrat's OS/2 strikeout metrics (`skia-paint-geometry/strikeRect.ts`) and the canvas takes the row opacity - 12 host views -> the same canvas as any painted row (jest host count, stubbed rasterizer). The hosted fill no longer sheds on a fling: it stays mounted, the shared clock already pauses texture frames, and the row drops its scroll subscription (12 host views remounted per painted row per fling -> 0; fling renders 3 -> 1). Per-canvas mount `requestAnimationFrame`s share one frame through `util/paintCanvasRedraw.ts`, and a reused row with new bitmaps redraws. The native `PaintedUsername*` spans are on `ChatRowText` via `getChatRowTextStyleForProp`. Reassure, 4 interleaved rounds, 40 samples/arm, against `1ab5639`: Skia painted screen -57% (a third moderated), Skia fling -74%, hosted fling -58%, no-paint usernames -5.5% (t=-2.3); `chat-node-kinds` within noise. Jest numbers are directional for the Skia path (rasterizer stubbed). Open: device fling QA of the `native` renderer (the shed was tagged FOAM-TV-MOBILE-BJ, which no longer resolves in Sentry), and whether the 0.72 fade on a Skia moderated name (the hosted path compounds two 0.72 layers to ~0.92) is the wanted look. Per texture frame: LANDED 2026-11-13. `useSharedPaintFrames` re-rendered each animated row on every texture frame, and `ref.redraw()` cannot replace that: in react-native-skia 2.14 it only calls `SkiaViewApi.requestRedraw`, which replays the recorder or picture the view already holds (`cpp/rnskia/RNSkPictureView.h` `drawInto`), and the SkImage is baked when `Container.native.ts` records the tree after a React commit. A name with a texture layer now draws into a `SkiaPictureView`: the frame clock schedules a shared-frame redraw (`util/paintCanvasRedraw.ts`) that records an `SkPicture` on the JS thread with the current frame of each URL (`util/paintLayerPicture.ts`) and hands it over with `SkiaViewApi.setJsiProperty(nativeId, 'picture', ...)`. Pixel-identical to the declarative tree in CanvasKit across 24 layer cases. Reassure `PaintedUsernameAnimated.perf-test.tsx` (8 animated rows, 30 ticks), 4 interleaved rounds against `edd09db`: 32 -> 2 commits, 22-26ms -> ~0-1ms of React work; a picture record costs ~21us in dev Hermes on the simulator, against a React render plus a Skia reconcile and record before. The state moved to `util/sharedPaintAnimationStore.ts`.
- **F3 - `Text` per-span cost. LANDED 2026-11-13** (`22dd55b`): `ChatRowText` (plain RNText, `_c(2)`) plus interned style tuples in `chatRowTextStyle.ts` replaced `ChatText` (`_c(58)`) on the hot row spans. Converted row kinds -6% to -10% significant against a -1% to -3% control. Notice rows and cheermote/gif fallbacks stay on `ChatText` on purpose; the native `PaintedUsername*` spans moved in F2. Jest does not run the React Compiler, so reassure cannot see `_c` cache savings - those need a device or GC measurement.
- **F4 - Ingest object churn. LANDED 2026-11-13** (`4c6ea87`, `f88c159`, `bec229b`): `ensurePartIdsForStore` deleted (its `defineProperty` forced dictionary mode and broke shared token identity; safe because nothing subscribes below `chatStore$.messages` and token React keys are positional); spreads collapsed 7 -> 3 (parse, finalize, store); `pendingEmoteParse` set to `undefined` inside the one finalize copy. Ingest pipeline perf test -15.7% significant. Emote token interning: LANDED 2026-11-13. `processEmotes` keeps one token per `SanitisedEmote` object in a `WeakMap` (an emote set change frees the old tokens with the old emote objects; no size bound needed) and reuses it in every message and parse-cache entry whose matched word equals the token's `content` (emoji words that differ get their own token, because `original_name` comes from the word). The zero-width pass copies a shared base before it adds `overlaid`; only that per-message copy carries the array, and `emoteProcessor.overlays.test.ts` pins that. `applyMentionLoginCasing` already copies on write; nothing else in `src` writes to a token field. Numbers (Bun, separate process per arm against `e0df650`): `foam-exact` `bench:mem` retained 2.62 -> 2.47 MB, msg/sec and churn peak inside run-to-run noise (the flood has 1 emote in 10 tokens); a 6-emotes-per-line flood retained 4.06 -> 2.91 MB and -3% to -6% time; a 3-overlays-per-line flood retained 4.20 -> 3.42 MB and -2% to -3% time, so the copy does not eat the win. Reassure ingest pipeline and `resolveMessageEmoteTokens`, 6 interleaved rounds against a worktree: -0.1% (t=-0.07) and +0.3% (t=0.29), no change. Checked and left: emote tokens copy `thumbnail` and `aspect_ratio`, which no emote consumer reads (`thumbnail` is read only on media-link tokens), but with one token per emote, removing them saves bytes per emote, not per message.
- **F5 - 7TV `emote_set.update` tail stall. LANDED 2026-11-13** (`e99178e`; content-versioned keys were already in `emoteProcessor.ts`): `seven-tv-emote-delta.ts` records changed names, `pickEmoteReprocessScope.ts` gates a name-filtered pass (threshold 32 names, bulk edits fall back to a full re-walk), untouched rows keep message and token-array identity, and a small update runs as one synchronous batch instead of 25 timer-spaced ones. -63% on the reprocess perf test. `4b841d5` also fixed `getCurrentEmoteData`'s identity-keyed memo returning stale emote data after a live update (the bug is on `main` too).
- **F9 - Emote content key hash. OPEN, measured 2026-11-13.** The first `processEmotes` after a channel load builds the base collection, and ~95% of that time is `getEmoteArrayContentKey` hashing each character of id, name, alias and url for every emote. 4895 emotes (emoji 3205 + 7TV channel 1000 + the rest): 26-28ms on V8 `--jitless`, 6-7ms Bun, 2.4-4.5ms V8 JIT. The Map build is 0.4-0.6ms jitless. Each `emote_set.update` re-hashes the whole 7TV array, because `updateSevenTvEmotes` makes a new array: 5.1-5.7ms (1000 emotes) and 13.1-13.8ms (2500) jitless. A scratchpad prototype caches a per-emote hash in a WeakMap keyed by the emote object (untouched emotes keep their object) and combines n ints in order: 0.07-0.09ms and 0.18-0.28ms. On JSC the `[h1, h2]` tuple per field alone costs 10x; V8 removes it. The emoji key can come from the style plus the generated dataset version. Prove with `use-emote-reprocessing.perf-test.ts` and a new cold-channel-load perf test. A worker does not fix this: it can only hash on the fetch path, not the delta, MMKV or emoji paths.
- **F10 - LegendList list height goes through JS `Animated` and `setNativeProps`. LANDED 2026-11-14.** `ContainersLayer` in `@legendapp/list` 3.3.3 (`react-native.mjs:5661`, `useValue$("totalSize")`) bound the list height to a JS `Animated.Value`. Each `totalSize` change called `setValue`, and on Fabric `createAnimatedPropsHook` then called `setNativeProps`: one more shadow tree commit with a full layout on the JS thread. The Animated path exists for the old architecture, where it skips a React render; `PositionViewState` already uses state on the new architecture. The `@legendapp/list` patch now reads `totalSize` with `useArr$` on the new architecture and renders a plain `View`. `set$("totalSize")` runs in the same synchronous block as the `containerPosition` updates (`updateItemSizes` from the `ContainerLayoutCoordinator` layout effect), so the height goes into the commit that already carries the positions. The old architecture keeps the Animated path. Dev build, simulator, 2 interleaved rounds of 20s windows (counters: wrapped `ReactNativeElement.prototype.setNativeProps` and `onCommitFiberRoot`): `setNativeProps` 29/s -> 0 (medium) and 68/s -> 0 (heavy); React commits/s unchanged (12.8 -> 11.9, 16.0 -> 16.9), so no commit was added. `sample` JS thread: `ShadowTree::commit` 5.8% -> 2.3% (medium) and 11.5% -> 5.4% (heavy); `layoutTree` 4.1% -> 1.8% and 7.8% -> 3.1%. Busy 56.3% -> 55.3% (medium); heavy stays at 99% because the freed time renders more rows (`createNode` 2.2% -> 2.8%). Suite (`perf:chat:ios`, 140s): JS thread 68.6% -> 66.9%, main thread 23.4% -> 22.0%. Suite results, 5 interleaved rounds: medium JS fps 29.5 -> 32 (p10 24.5 -> 29.5, dropped frames 47% -> 41%), ui-jank 2.9 -> 2.5/s, cpu 85% -> 76%. Heavy: JS fps 4 both; ui-fps 47.6 -> 45.8 and ui-jank 4.8 -> 5.4/s, with cpu 141% -> 151% - the JS thread mounts more rows, so the main thread and image decode do more work. Check that on a device. Scroll anchoring, 3 interleaved rounds per arm with a JS probe of `ctx.state`: same in both arms. The list stays pinned in the flood, the pill shows on scroll-up, and the anchor row holds while rows append. Known in both arms (not F10): after Jump to latest in the heavy flood, the window trims 500 -> 150 and the list shows blank or top rows for about 1s (5 of 30 burst frames blank in each arm). Jest mocks `@legendapp/list`, so reassure cannot see this change.
- **F11 - JS heap grows during a flood. OPEN, P2, cause not found, 2026-11-14.** Dev build, simulator, medium flood (60 msg/s, 150-message window, no paints). Live heap after a forced `gc()`: 91 -> 99 -> 106 -> 112 -> 118 MB at one-minute steps, about 6.5 MB/min or ~1.8 KB per message. `js_heapSize` rose 164 -> 260 MB in 8 minutes. With injected 7TV paints the heap was 416-444 MB at about 8 minutes. The cost shows in GC: `HadesGC::OldGen::search` (free-list search during young-gen promotion) went from 0.2% of the JS thread on a fresh app to 1.6% at 3 minutes, 4.1% at 5.5 minutes and 21.6% at about 10 minutes, and total GC from 6.9% to 33% of the JS thread. Next step: two heap snapshots a few minutes apart and a diff by constructor. A CDP client through Metro's `/inspector/debug` needs an `Origin` header and still closed with 1006 while argent held the session, so use the Fusebox Memory tab. Run the same curve on an internal build before a fix, because React dev owner stacks and `console.createTask` (32% of the JS thread inclusive in this dev build) retain per-element objects only in dev. Suspects in app code: caches keyed per chatter (the synthetic flood makes new user names).

**Medium ceiling**

- **F6 - Row style array. LANDED 2026-11-13** (`b869d9d`): `ChatRowSurface` flattens the variant overrides once per variant key into a bounded cache; the per-render result is 3 entries with stable member identities. Visible rows -4.4% directional.
- **F7 - Scroll/touch on JS. PARTLY LANDED 2026-11-13** (`2db75ef`): `poke()` was already cheap (one settle timer); the real per-event timer was the app's own `scrollEventThrottle={16}` feeding LegendList's JS throttle (124 timer churns/s at 120Hz -> 0) - removed on the chat and emote lists. Moving the handler to `useAnimatedScrollHandler` was measured and skipped: LegendList runs its own JS `onScroll` per native event, so the saving is ~0.45µs/event against real rewiring risk. The `Gesture.LongPress` row migration is written up (in that commit's agent plan) but not done; it needs device QA and a mount-cost run.
- **F8 - Commit-path memo gaps. LANDED 2026-11-13** (`41b01f0`, `9af71d9`, `ad3121e`): `findBadges` two-generation cache (-67%); evicted rows reuse the stored id; mention scan skips lines without `@`. Checked and left: `extractEmotesFromTag` was already cached; `shiftMessageIndexes` was already an offset; `parseIrcMessage` offset reuse saves ~2.5% of a parse; the haptics/highlight scan order is a behaviour trade-off under chat delay.
- **Quick wins - LANDED 2026-08-07** (reassure: visible-rows render -10.7% significant, list window -30.8% directional, no render-count change): viewability key-join deleted (dead guard - LegendList diffs membership upstream), `minimumViewTime` dropped, `messageListExtraData` keyed on joined `highlightedUsersKey`, `getVisibleMessages` bails before allocating, `InlineMessageLine` reads `getMessageStructure(...).containsEmotes`, `useRowVisibility` moved to a `useState` initialiser (both `??=` and the if-null ref pattern bail the compiler; the `useState` form verifiably compiles), dead `shouldMaintainScrollAtEndRef` removed. The per-badge closure in `ChatMessageBadges` is gone. Caching the key string in a WeakMap was measured slower (badge rows +1% to +5%, deleted rows +7.7%) and reverted (`08ce152`), so the template literal stays.

## Severity and report

| P0 | Sustained over-budget frames in a normal flood | measured, reproducible |
| P1 | Visible jank in a hot scenario | measured under a harness |
| P2 | Unbounded growth over a session | show the curve |
| P3 | Wasted work, no visible symptom | quantified or it is not a finding |
| P4 | Trade-off for the record | |

P0/P1 require a number; otherwise P3 marked `unverified`. Write findings to `.claude/perf/chat-<short-sha>.json` (shape in the parent method), each with `severity`, `location`, `finding`, `evidence` (with provenance rung - see references/measurement-recovery.md), `fix`, `risk`. A clean audit is a valid result; do not manufacture findings.

## Prove the fix

One item at a time, highest ceiling first. Narrowest change → same harness, same device, same scenario → **if the number did not move, revert** (an allocation win invisible to reassure duration stats needs a GC/device measurement or an honest "directional" label). Then `bun run ts:check`, affected `bun run test`, `bun run test:perf` if render counts could shift, `bun run lint:ast-grep` if imports moved. Anything touching gestures, scroll or recycling additionally needs `bun run e2e:test:smoke`. Platform-specific fixes claim platform-specific wins only.

## Head-to-head benchmarking

Protocol in references/benchmarking.md. Name the structural gap out loud, match feature sets (7TV paints on both or neither), measure frame time + latency + 10-minute thermals, and report the loss cases - Foam's 100ms flush floor makes the other app look more live at equal frame rates; say so.

## References

- references/derivation.md - re-derive when this file's facts go stale
- references/measurement-recovery.md - broken-harness fallback ladder (xctrace-on-sim, DevTools bridge, reassure stash-baseline)
- references/usual-suspects.md - the generic catalogue, extended with patterns this repo actually hit
- references/benchmarking.md - competitive protocol
- Repo ground rules: `AGENTS.md` (fixture placement, store layout, test style)
- Flush cadence rationale: issue #594, quoted in `Chat/util/chatFlushCadence/pickFlushDelay.ts`
