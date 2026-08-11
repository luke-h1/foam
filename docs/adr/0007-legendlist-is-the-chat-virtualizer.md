# LegendList is the chat virtualizer; FlashList stays on non-chat screens

The chat message list (`components/Chat/components/ChatList.tsx`) renders
through `@legendapp/list` v3 (patched, ADR-0006). FlashList 2.0.2 remains the
virtualizer for non-chat screens (Top, Search, Blocked Users) and two chat
sheets (Chatters, Saved Phrases) via the `components/FlashList` wrapper.

The chat list's requirements are the ones LegendList was adopted for:
bottom-anchored chat with `maintainVisibleContentPosition` semantics that are
disabled at-bottom, stable scroll anchoring across prepend/append under the
trimming window, and per-row visibility callbacks (`rowVisibility.ts`) that
drive animation pause and asset hydration. The chat composer suggestion rails
and the emote sheet ride the same library so chat carries one virtualizer.

Two stronger alternatives were evaluated and rejected:

- **An observable-bound list** (rows subscribing straight to store nodes,
  skipping React list diffing) - investigated and found not feasible with the
  current list libraries; the row-identity and recycling contracts don't
  survive it.
- **Recycling as shipped** - `CHAT_RECYCLE_ITEMS` exists but is off pending
  row-state-outliving-recycle fixes (`ChatInlineImage` recyclingKey races) and
  on-device fling QA; see `PERF_REPORT.md` "F1".

The list's row identity contract is owned by `utils/chat/messageIdentity/`
(`getChatMessageListKey` is the `keyExtractor`); the list dropped its
render-time dedup on the strength of that shared module, so any list change
that re-derives keys locally is a regression.

## Consequences

Two virtualizers in the bundle. Accepted: migrating the remaining FlashList
surfaces is pure churn on cold screens, and chat - the only surface with hard
anchoring/perf requirements - already sits on one library end to end.
