# Performance audit fixes - 2026-07-10

Branch: `perf/chat-perf-audit` (3 commits on top of `origin/main` d7ee9099).
Working against the ranked findings of the 6-agent chat perf audit from earlier
today (see memory `project_chat_perf_audit_2026_07_10`), which had confirmed
findings but nothing fixed. This session verified the top findings against
current source, built count-based measurements, fixed them, and re-measured.

## Measurement approach

No device was attached, so measurements are deterministic counters against the
real modules in Jest (reprocess restarts, observable notifications, MMKV write
counts, event-loop-turn chunk sizes), plus the Sentry evidence already in the
audit (p75 157ms hydration tick, "reprocess never finishes in busy channels").
Wall-clock claims are avoided where they could not be honestly measured.

## Fixed (each re-measured)

### 1. 7TV cosmetics churn - `f7df1711 perf(chat): stop 7tv cosmetic churn ...`

- **Location:** `src/store/chat/actions/cosmetics.ts`
- **Measured cost (baseline):** a simulated 100-wearer entitlement burst of one
  shared paint+badge (the channel-entry pattern) produced **200
  cosmeticBindingsVersion bumps** (= 200 full-window reprocess restarts, each
  clearing the processed-message set) and **10,000 synchronous MMKV writes**
  (O(m²): every `addPaint`/`addBadge` rescanned the session cache and re-synced
  every earlier wearer). Every `addPaint` also stored a fresh object identity,
  rotating the WeakMap-keyed paint layer caches (`paintLayer.ts`) so painted
  usernames recomputed layers/shadows/gradients from cold after every sighting.
- **Root cause:** definition writes had no change detection, and binding writes
  bumped the reprocess version once per newly sighted chatter.
- **Fix:** equal-content guard on `addPaint`/`addBadge`/`updatePaint`/
  `updateBadge`; paint bindings no longer bump the reprocess version at all
  (paints render reactively via `CosmeticUsername` `useSelector`; the reprocess
  pass reads only emotes and badges); badge-binding bumps coalesce into one
  trailing bump per 1s window.
- **Measured after:** 10,000 → **100** MMKV writes; 200 → **1** reprocess
  restart per burst; stored paint identity stable across re-adds.
- **Regression tests:** `src/store/chat/__tests__/cosmeticsChurn.test.ts`.
- **Note:** the audit's sub-claim "equal-content set re-renders all wearers"
  was refuted during verification - Legend State does not notify on
  equal-content sets (verified empirically). The WeakMap rotation, O(m²)
  writes, and reprocess restarts were all real.

### 2. Visible-asset hydration sync tick - `a75a32dd perf(chat): time-slice visible-asset hydration reprocessing`

- **Location:** `src/components/Chat/util/hydrateVisibleSevenTvAssets.ts`
- **Measured cost (baseline):** when bulk cosmetics land, every visible message
  has cached assets at once and the whole screenful re-parsed synchronously in
  a single tick - measured **24/24 reprocess calls in one event-loop turn** in
  the new spec; Sentry had this as the #1 chat hotspot (p75 157ms under the
  hydration timer).
- **Fix:** cached-asset reprocessing now runs 6 per event-loop turn with a 32ms
  gap, matching the full-window reprocess cadence (`useEmoteReprocessing`).
- **Measured after:** max synchronous chunk 24 → **6**, all 24 messages still
  reprocessed, all 10 pre-existing behavior tests unchanged.

### 3. Write-only websocket send queue - `42e0bc04 perf(chat): drop the write-only websocket send queue`

- **Location:** `src/hooks/ws/useWebsocket.ts:33,63`
- **Measured cost:** every send attempted while the socket was not OPEN pushed
  into `messageQueue`, which nothing ever drained or cleared - unbounded
  retention for the hook's lifetime, and the messages were silently lost
  anyway (verified: no reader exists).
- **Fix:** removed the dead queue. Both consumers (`twitch-chat-service`,
  `useSeventvWs`) gate sends on `readyState === OPEN` and re-issue state on
  open/reconnect, so observable behavior is exactly preserved. Draining
  instead would have introduced new, untested replay of stale IRC/EventAPI
  commands after reconnect - deliberately not done.

## Verification

- `bunx tsc --noEmit` clean after each change (babel-jest does not typecheck).
- Full suite: 9,618 tests, 221 suites - green on two consecutive runs.
- One unidentified test failed on the first full run only (1/9,618) and did
  not reproduce in two subsequent runs. The tree carries ~49 uncommitted
  modified test files from the separate test-quality batch; the flake most
  likely lives there (AuthContext call-count fragility is a known latent).
  Worth watching on CI.

## Remaining worklist (from the audit, ranked, not done here)

1. **cosmeticsBridge.ts clones 3× ~2000-entry link maps per entitlement event**
   (High) - file has uncommitted modifications from the composition-audit
   batch; touching it would have mixed unrelated work into a perf commit.
   Fix after that batch lands: keyed child writes + plain FIFO.
2. **Working-tree bugs from the audit** (probe race on `awaitingPongRef`,
   unescaped `reply-parent-msg-body`) - these live in the _uncommitted_
   working-tree changes owned by another session, not in committed code.
3. **Mediums:** alternating-row stripe keyed to list index (`useChatRowRenderer`
   - staged file, same conflict), reply-quote/sub-notice render-time full
     parse, `parseIrcTags` allocations, `Image.tsx` double-decode on disk-cache
     swap, `emoteProcessor` baseCollectionCache cap 64 (pins tens of MB - drop
     to 2-4), cosmetics persist sync stringify → `offThreadJson`.
4. **Sentry follow-ups:** re-check `estimateRefBytes` p75 after build 297
   traffic; `TwitchWsService.getActiveSubscriptions` p75 250ms;
   `getSanitisedChannelBadges` p75 92ms.

## Tried / measured / discarded

- Considered counting Legend State notifications as the "re-render storm"
  measurement for addPaint churn; measurement showed equal-content sets never
  notify, so that claimed mechanism was dropped from the fix rationale rather
  than shipped as a fake win.
- Considered draining the websocket queue on open instead of deleting it;
  rejected as a behavior change (stale command replay) outside audit scope.
