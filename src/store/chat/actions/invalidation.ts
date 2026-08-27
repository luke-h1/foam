import { chatStore$ } from '../observables/chatStore';
import { clearSessionCache } from './chatColorCaches';

/**
 * Mention spans subscribe to `mentionLoginRevision` themselves, so a bump
 * re-renders only them, never rows or the list.
 */
export function invalidateMentionColors(): void {
  clearSessionCache('mentionColors');
  chatStore$.mentionLoginRevision.set(revision => (revision ?? 0) + 1);
}

/**
 * Only badge changes may call this: bumping for paints reintroduced a
 * reprocess storm on entitlement bursts - see cosmeticsChurn.test.ts.
 */
export function invalidateBakedBadges(): void {
  chatStore$.cosmeticBindingsVersion.set(version => version + 1);
}

/**
 * Bump after wiping cosmetic caches so the next channel emote/badge load
 * cannot serve the cleared data.
 */
export function invalidateCosmeticsCache(): void {
  chatStore$.cosmeticsCacheVersion.set(version => version + 1);
}

/**
 * A bump re-hydrates the visible rows, so bump only when a user's personal
 * emote ids actually changed.
 */
export function invalidatePersonalEmotes(): void {
  chatStore$.personalEmotesVersion.set(version => version + 1);
}
