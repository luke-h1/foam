import { chatStore$ } from '../observables/chatStore';
import { clearSessionCache } from './chatColorCaches';

/**
 * Mention colours resolve lazily per span. `MentionSpan` and the composer
 * suggestions subscribe to `mentionLoginRevision` themselves, so a bump
 * re-renders only the mention spans, never whole rows or the list -
 * `useChatRowRenderer` intentionally excludes this revision from its extra
 * data. Also drops the mentionColors session cache so a stale colour cannot
 * be re-served after the index learns a better login match.
 */
export function invalidateMentionColors(): void {
  clearSessionCache('mentionColors');
  chatStore$.mentionLoginRevision.set(revision => (revision ?? 0) + 1);
}

/**
 * Badge art is baked into committed message rows, so `Chat` keys the full
 * emote-reprocess pass on `cosmeticBindingsVersion` and a bump restarts that
 * walk. Only badge definition/binding changes may call this: paint bindings
 * are live-bound in `PaintedUsername` / `UserChatBody` and bumping for them
 * reintroduced a reprocess storm on entitlement bursts (pinned by
 * cosmeticsChurn.test.ts). Burst coalescing lives at the call sites
 * (`scheduleCosmeticBindingsBump`).
 */
export function invalidateBakedBadges(): void {
  chatStore$.cosmeticBindingsVersion.set(version => version + 1);
}

/**
 * `useChatEmoteLoader` refetches the channel emote/badge resources when
 * `cosmeticsCacheVersion` moves; bump it after wiping cosmetic caches so the
 * next load cannot serve the cleared data.
 */
export function invalidateCosmeticsCache(): void {
  chatStore$.cosmeticsCacheVersion.set(version => version + 1);
}

/**
 * Personal 7TV emotes are per-sender, outside the channel emote data. The
 * visible-asset hydration pass clears its dedup keys and re-hydrates the
 * currently visible rows when `personalEmotesVersion` moves; bump only when a
 * user's personal emote ids actually changed.
 */
export function invalidatePersonalEmotes(): void {
  chatStore$.personalEmotesVersion.set(version => version + 1);
}
