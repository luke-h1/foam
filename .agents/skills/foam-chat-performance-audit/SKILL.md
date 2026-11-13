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
- **Patched deps:** `patches/` carries expo-image (15fps animated cap, shared CADisplayLink), @expo/ui. A finding inside a patched package must state whether the patch is implicated.

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
| `bun run perf:chat:rn` | React DevTools profile (slow components, rerenders) | Works, but order matters: Metro must be alive (`curl localhost:8081/status`), the DevTools daemon must be listening before app launch, and a stale agent-device session must be closed first. The script's first `wait --connected` hangs if the app predates the daemon - terminate/relaunch the app, then drive the steps manually. Suite: `FOAM_CHAT_DEEPLINK='foam://dev-tools/chat-perf?suite=1' FOAM_RN_PROFILE_SECONDS=600 bun run perf:chat:rn`. |
| `bun run perf:chat:ios` | Time Profiler (device) / `sample` call stacks (simulator) | Works. The script auto-detects simulators and uses `sample` on the host process because xctrace records nothing against a sim (empty bundle, `Document Missing Template Error` on export); it prints a hotspot summary and writes `.sample.txt` + `.summary.txt`. Simulator numbers are dev-build directional. Set `FOAM_FORCE_XCTRACE=1` to retry xctrace after an Xcode update - the script now detects and reports the empty-bundle case instead of hanging. Suite: `FOAM_CHAT_DEEPLINK='foam://dev-tools/chat-perf?suite=1' FOAM_INSTRUMENTS_SECONDS=600 bun run perf:chat:ios`. |
| `dev-tools/chat-perf`, `dev-tools/image-benchmark` | On-device synthetic flood + live CPU overlay; `?suite=1` runs the 2-minute suite | dev/internal/e2e variants only. |

Live scenario used for captures: `foam://chat?channelId=71092938&channelName=xqc` (see `scripts/perf/capture-chat-*.sh` for the env knobs: `FOAM_IOS_UDID`, `FOAM_CHAT_CHANNEL_ID`, `FOAM_INSTRUMENTS_SECONDS`).

Reference numbers from the 2026-08-07 audit (dev build, sim, steady-state live xqc): JS thread ~7% busy, GC ~2.5%, per-flush pane re-render at the 10/s flush cap; the visible CPU was vImage emote decode and software H.264 off the JS thread. Steady state is healthy - the findings live in flings, bursts and tail events.

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
| Off-thread JSON | `lib/offThreadJson/**` |
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
- **F4 - Ingest object churn. LANDED 2026-11-13** (`4c6ea87`, `f88c159`, `bec229b`): `ensurePartIdsForStore` deleted (its `defineProperty` forced dictionary mode and broke shared token identity; safe because nothing subscribes below `chatStore$.messages` and token React keys are positional); spreads collapsed 7 -> 3 (parse, finalize, store); `pendingEmoteParse` set to `undefined` inside the one finalize copy. Ingest pipeline perf test -15.7% significant.
- **F5 - 7TV `emote_set.update` tail stall. LANDED 2026-11-13** (`e99178e`; content-versioned keys were already in `emoteProcessor.ts`): `seven-tv-emote-delta.ts` records changed names, `pickEmoteReprocessScope.ts` gates a name-filtered pass (threshold 32 names, bulk edits fall back to a full re-walk), untouched rows keep message and token-array identity, and a small update runs as one synchronous batch instead of 25 timer-spaced ones. -63% on the reprocess perf test. `4b841d5` also fixed `getCurrentEmoteData`'s identity-keyed memo returning stale emote data after a live update (the bug is on `main` too).

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
