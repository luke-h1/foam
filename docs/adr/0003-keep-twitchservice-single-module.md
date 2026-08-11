# Keep twitchService as a single module (don't split into domain services)

`src/services/twitch-service.ts` is a 1040-line module exposing one
`twitchService` object with ~28 heterogeneous methods (streams, channels, clips,
videos, polls, predictions, eventsub, blocklist, tokens, rewards). Splitting it
into domain-grouped services (streams / clips / eventsub / …) would improve
reading-navigability — each domain's endpoints would live together.

We deliberately keep it as one module.

- It is **already deep**: every method sits behind the shared `createApiClient`
  seam. A split is pure reorg (locality of _reading_), not a deepening — it adds
  no leverage and removes no duplication.
- The cost is **disproportionate**: `twitchService` is imported by ~30 files with
  ~106 call sites, 18 of them test files that `jest.mock('@app/services/twitch-service')`
  and key assertions on `twitchService.<method>`. The module also _exports the
  shared response types_ (`UserInfoResponse`, `TwitchStream`, `PaginatedList`,
  `Channel`, `Category`, …) that consumers import directly, so a split entangles
  type imports as well as method calls.
- The low-churn alternative — keep a composed `twitchService` facade over domain
  files — neither reduces the import surface (callers still take the god-object)
  nor avoids the shared-type tangle, and risks import cycles (domain files need
  the shared types that live in the facade module).

Net: high churn + real regression risk (test mocks, type imports, cycles) for a
navigability-only gain on already-deep code. Fails the deletion test as a
_deepening_ — deleting the split would not concentrate any complexity.

## Consequences

`twitch-service.ts` stays large. If it becomes an active friction point, revisit
by first moving the shared response types to `src/types/twitch/*` (decoupling the
type-import tangle), then splitting methods — but only if the navigability pain
is real, not pre-emptively.
