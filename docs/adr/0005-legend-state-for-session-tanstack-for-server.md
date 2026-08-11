# Legend-State owns session state, TanStack Query owns server state

Foam runs two state systems side by side and the split is deliberate, not
historical. The Interface of the split - what a caller must know to pick the
right one - is one question: **who owns the truth?**

- **A remote HTTP service owns it and could serve it again on refetch** ->
  TanStack Query. Helix streams/channels/VODs/clips, StreamElements stats,
  user info. Query owns caching, refetch, invalidation, and stale time; the
  `twitchService` module (ADR-0003) is the fetch layer under it.
- **The session owns it** - it arrived over a socket (IRC, EventSub, 7TV
  EventAPI), the user set it, or ingest derived it - > a Legend-State
  observable under `src/store/` (`chatStore$`, `preferences$`,
  `chatTransientState$`). There is no server to refetch chat state from;
  losing it is losing the session.
- **Hot ingest/render paths own scratch that is only ever read imperatively**
  (mention colours, shared badge lookups, parse caches) -> a plain
  module-level `Map` with a size bound and a clear function, per the store
  layout rules in AGENTS.md. Routing these through an observable clones and
  key-diffs the bucket on every write; routing them through Query adds an
  async cache for data that is never fetched.

One clause outranks the ownership question: **access pattern trumps
ownership**. Data the parse/ingest path must read synchronously - channel and
global emote/badge sets, cheermotes, cosmetics - lives store-side (observable
or bounded Map, per-case) regardless of having been fetched over HTTP, seeded
via a `store/chat/actions/` crossing, and may carry its own freshness policy
there (`channelRefreshPlan`). The same dataset must not then also live in
Query: one cache, one staleness model, and the Query side is the one that
yields.

Preferences persist through the one `preferences$` observable in
`store/preferenceStore.ts` (MMKV-backed); server data outside the
synchronous-ingest class is never persisted through Legend-State, and session
data is never mirrored into Query.

Violations of this rule are findings. The split itself is settled: collapsing
onto Query alone puts socket-pushed state behind an async cache designed for
request/response, and collapsing onto observables alone re-implements
refetch/invalidation by hand where Query already carries it.

## Consequences

Two libraries, two mental models, and a real seam a reader must learn once.
Some data crosses the line at ingest (a Helix fetch seeding chat state via a
store action); the crossing point is an action in `store/chat/actions/`, and
that is the one place the two systems are allowed to touch.
