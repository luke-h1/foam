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
- **Surface stack:** LegendList (check installed version in `node_modules/@legendapp/list/package.json` - config comments have described other versions' semantics; the installed source is the truth). `recycleItems` OFF as a crash workaround (`ChatList.tsx`, `CHAT_RECYCLE_ITEMS`). Legend State with leaf subscriptions; hot imperative caches are plain module Maps by design (see AGENTS.md). Ingress is raw IRC over WebSocket. Reanimated 4 + worklets available; scroll/touch on the chat path are still JS-thread refs and timers.
- **Patched deps:** `patches/` carries expo-image (15fps animated cap, shared CADisplayLink), @expo/ui. A finding inside a patched package must state whether the patch is implicated.

## Budgets

| Target | Budget | Applies to |
| --- | --- | --- |
| 120fps | 8.33ms | ProMotion iPhones - the scroll bar to judge by |
| 60fps | 16.67ms | Everything else, all Android test devices |
| Sustained flood | No frame over budget for 60s at 40+ msg/s | The scenario that separates clients |

JS thread and main thread each get the full budget and both must fit.

## Harnesses, and their measured state

| Command | Measures | State (2026-08-07) |
| --- | --- | --- |
| `bun run test:perf` / `bunx reassure --testMatch "**/<name>.perf-test.*"` | JS duration + render counts vs baseline | Works. For uncommitted changes use the stash-baseline protocol in references/measurement-recovery.md. Duration stability is 10-35%; allocation wins may not reach significance - report that honestly. |
| `bun run perf:chat:rn` | React DevTools profile (slow components, rerenders) | Works, but order matters: Metro must be alive (`curl localhost:8081/status`), the DevTools daemon must be listening before app launch, and a stale agent-device session must be closed first. The script's first `wait --connected` hangs if the app predates the daemon - terminate/relaunch the app, then drive the steps manually. |
| `bun run perf:chat:ios` | Time Profiler (device) / `sample` call stacks (simulator) | Works. The script auto-detects simulators and uses `sample` on the host process because xctrace records nothing against a sim (empty bundle, `Document Missing Template Error` on export); it prints a hotspot summary and writes `.sample.txt` + `.summary.txt`. Simulator numbers are dev-build directional. Set `FOAM_FORCE_XCTRACE=1` to retry xctrace after an Xcode update - the script now detects and reports the empty-bundle case instead of hanging. |
| `dev-tools/chat-perf`, `dev-tools/image-benchmark` | On-device replay / synthetic flood + live CPU overlay | dev/internal/e2e variants only. |

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
| Flip `recycleItems` on | It is a crash workaround - the frontier item is the crash |
| Window trim copies | `appendToMessageWindow` slices before concatenating |
| `__tests__`, `.stories`, `src/dev/**` | Not in the production graph |

## The frontier (as audited 2026-08-07 - full findings in `.claude/perf/`)

Ranked by ceiling. Verify each still exists before working it; the tree moves.

**High ceiling**

- **F1 - Recycling is off.** Unchanged, still the largest structural gap. The work is the crash (row state outliving recycle; `ChatInlineImage` recyclingKey races), not the flag.
- **F2 - Paint `native` renderer.** Production default mounts ~25 native views per painted username (MaskedView offscreen pass, 4 glyph copies, SVG gradients, nested Skia canvases), and the scroll-shed unmounts/remounts that whole subtree on every fling. Moderated rows are excluded from the cheaper Skia path for no structural reason. Fix shape: make `skia` the prod flag, stop shedding-by-unmount, bound or share per-row frame callbacks. (`webview` is provably unreachable in prod: type-narrowed flag + Remote Config clamp + dev-tools gate.)
- **F3 - `Text` per-span cost.** The design-system `Text` compiles to `_c(79)` per instance and recursively walks incoming style arrays; chat renders 4+ instances per row with fresh style-array identities per span. Fix shape: a chat-local span primitive over `RNText` with pre-resolved font/colour, or interned style tuples so the memo hits.
- **F4 - Ingest object churn.** `prepareMessagePartsForStore` clones every part and `Object.defineProperty`s each (dictionary-mode pressure), destroying the parse-cache's shared-identity benefit downstream; 7 whole-message spreads between IRC line and store; add-then-`delete` of `pendingEmoteParse` forces dictionary mode. Fix shape: derive part ids positionally, collapse spreads to parse-time + commit-time.
- **F5 - 7TV `emote_set.update` tail stall.** One event re-walks the whole window and invalidates the entire parse cache via array-identity keying (~800ms sustained, landing during hype moments). Fix shape: name-filtered reprocess + content-versioned collection key.

**Medium ceiling**

- **F6 - Row style array.** 18 entries, 16 static-or-false, 17-way compare per row render (`ChatRow.tsx` Surface). Variant-key → pre-flattened map, colour tint as the only second element; intern `noticeSurfaceTint`.
- **F7 - Scroll/touch on JS.** `chatScrollActivity.poke()` re-arms a timer per scroll event (~60/s per fling); LegendList forces `scrollEventThrottle` to 0 internally; per-row `onTouchMove` marshals full touch events; per-emote `onTouchStart` targets. Cleanest path: `@legendapp/list/reanimated`'s `AnimatedLegendList` sharedValues + `Gesture.LongPress`. Integration risk: `isUserActivelyScrolling` reads `lastScrollEventAtRef` on the flush path - momentum-phase deferral breaks if per-event JS writes stop without a SharedValue replacement. The 650ms JS `setTimeout` long-press fires late under load; a native gesture fires on time.
- **F8 - Commit-path memo gaps.** `findBadges` result uncached across a chatter's repeated messages; `extractEmotesFromTag` uncached; `parseIrcMessage` re-scans offsets `isPrivmsgLine` already found; `getChatMessageKey` recomputed 4× per commit; mention scanning 2-3 passes; `shiftMessageIndexes` rewrites both index Maps per trimming flush (offset instead); ingest-time haptics/highlight scan runs before drop decisions.
- **Quick wins - LANDED 2026-08-07** (reassure: visible-rows render -10.7% significant, list window -30.8% directional, no render-count change): viewability key-join deleted (dead guard - LegendList diffs membership upstream), `minimumViewTime` dropped, `messageListExtraData` keyed on joined `highlightedUsersKey`, `getVisibleMessages` bails before allocating, `InlineMessageLine` reads `getMessageStructure(...).containsEmotes`, `useRowVisibility` moved to a `useState` initialiser (both `??=` and the if-null ref pattern bail the compiler; the `useState` form verifiably compiles), dead `shouldMaintainScrollAtEndRef` removed. Still open from this set: the per-badge closure + key string built in `ChatMessageBadges`'s loop.

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
