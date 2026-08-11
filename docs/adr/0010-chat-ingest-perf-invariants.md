# Chat ingest and render perf invariants outrank depth

The chat commit path has measured budgets from the 2026-07/08 perf campaigns
(`PERF_REPORT.md` is the ledger). Any deepening that touches ingest or the row
render path is scored against these invariants first; a design that buys
leverage by spending one of them is a regression, not a candidate.

The invariants:

- **Frame-cadenced, bounded commits.** Raw lines buffer pre-commit
  (`components/Chat/util/messageBuffer`) and enter the store in cadenced
  flushes (`components/Chat/util/chatFlushCadence`), draining bounded batches
  without dropping messages (sampling live commits silently dropped messages
  above 30/s once; never again). No abstraction may commit per-message.
- **One message identity, referentially stable.** `utils/chat/messageIdentity/`
  is the only source of message keys; buffer, store dedup index, and list
  keyExtractor agree, and the list's render-time dedup was deleted on that
  guarantee. Committed message objects and their parts arrays keep reference
  identity across flushes - the WeakMap caches over them
  (`deriveChatBody`/`scanChatBody`) and Legend-State's diffing both depend
  on it.
- **Content-keyed emote collections.** Emote collections key by content hash,
  not array identity, so a 7TV `emote_set.update` or channel-load settle does
  not invalidate every cached parse. New code derives keys from the collection
  key, never from array identity.
- **Per-message allocation budget is effectively zero.** The campaign's wins
  were removing clones, spreads, and transient objects per ingested message
  (`PERF_REPORT.md` landed table). A seam that introduces a wrapper object,
  options bag, or callback allocation per message on the ingest path undoes
  them.
- **The store write budget is measured.** `messages.set` at the 150-message
  window costs ~8-9µs under the patched Legend-State diff (ADR-0006); changes
  near the store path re-run the A/B bench.
- **Row renders stay compiler-cacheable.** No object-rest of renderer args in
  row components (an unconditionally-fresh dependency defeats every compiler
  cache slot), and every size/spacing literal in a chat row comes from the
  `chatScale` ramp per AGENTS.md.

And the process rule that produced all of the above: perf changes are measured
on the repo's own harnesses, and **if the number did not move, revert**. Jest
benches are directional; release-device numbers are truth.

## Consequences

Ingest-path code trades some conventional niceties (immutability-by-copy,
per-message closures, tidy options objects) for these budgets, and reviews of
that code must read this ADR plus `PERF_REPORT.md` before proposing structure.
A candidate that cannot state its per-message allocation cost is not finished.
