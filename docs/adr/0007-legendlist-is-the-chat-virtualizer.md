# LegendList is the chat virtualizer; FlashList stays on non-chat screens

The chat message list (`components/chat/components/ChatList.tsx`) renders
through `@legendapp/list` v3 (patched, ADR-0006). FlashList 2.0.2 remains the
virtualizer for non-chat screens (Top, Search, Blocked Users) and two chat
sheets (Chatters, Saved Phrases) via the `components/flash-list` wrapper.

The chat list's requirements are the ones LegendList was adopted for:
bottom-anchored chat with `maintainVisibleContentPosition` semantics that are
disabled at-bottom, stable scroll anchoring across prepend/append under the
trimming window, and per-row visibility callbacks (`components/chat/components/chat-message/util/rowVisibility.ts`) that
drive animation pause and asset hydration. The chat composer suggestion rails
and the emote sheet ride the same library so chat carries one virtualizer.

An observable-bound list was evaluated and rejected. Rows would subscribe
straight to store nodes and skip React list diffing. It is not feasible with
the current list libraries, because the row identity and recycling contracts
do not survive it.

## Row recycling

`CHAT_RECYCLE_ITEMS` is on. A reused row keeps its React state and its native
views, and only its props change. Recycling cut native view creation by about
3x and adds re-render work for reused rows.

The old iOS crash "attempt to recycle an already mounted view" came from
`@react-native-masked-view`. It ran through the legacy interop layer and moved
its children into a mask view, so Fabric found them still attached when it
tried to pool them. Painted usernames stopped using it in #641.

Row state that belongs to one message must reset when the message changes:

- `ChatRowItem` decides the entrance animation again for each message key.
- `useChatRowLongPress` drops a pending long press when the message changes.
  Under backpressure a flush does not wait for a held row, so the row can get
  a new message during the hold.
- `ChatInlineImage` resets its load state, ban and retry timer per url.
- The expo-image patch keeps an image ref when `recyclingKey` changes in the
  same prop batch. Without it, a reused emote view that got a new ref and a new
  key together stayed blank after the list settled.

Simulator QA on 2026-11-13 (iPhone 17 Pro Max simulator, dev build, synthetic
flood at 60 to 120 msg/s, 7TV paints on about two thirds of chatters):

- More than 450 flings with recycling on. No crash and no recycle error.
- Before the expo-image fix, settled screens showed blank emote slots in many
  rows. A run with recycling off showed about one. After the fix, 180 flings
  showed none.
- Some areas stay blank during a fast fling before their rows render. They
  fill when the list settles. This also happens with recycling off.
- With the flood off, 10 of 10 long presses opened the sheet for the row
  under the finger.

Before a release build ships, run the fling QA on a device at 60Hz and 120Hz
and measure the result there (ADR-0010).

The list's row identity contract is owned by `utils/chat/message-identity/`
(`getChatMessageListKey` is the `keyExtractor`); the list dropped its
render-time dedup on the strength of that shared module, so any list change
that re-derives keys locally is a regression.

## Consequences

Two virtualizers in the bundle. Accepted: migrating the remaining FlashList
surfaces is pure churn on cold screens, and chat - the only surface with hard
anchoring/perf requirements - already sits on one library end to end.
