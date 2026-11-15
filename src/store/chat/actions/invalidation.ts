import { chatStore$ } from '../observables/chat-store';
import { clearSessionCache } from './chat-color-caches';

export function invalidateMentionColors(): void {
  clearSessionCache('mentionColors');
  chatStore$.mentionLoginRevision.set(revision => (revision ?? 0) + 1);
}

/**
 * Only badge changes may call this: bumping for paints reintroduced a
 * reprocess storm on entitlement bursts - see cosmetics-churn.test.ts.
 */
export function invalidateBakedBadges(): void {
  chatStore$.cosmeticBindingsVersion.set(version => version + 1);
}

export function invalidateCosmeticsCache(): void {
  chatStore$.cosmeticsCacheVersion.set(version => version + 1);
}

export function invalidatePersonalEmotes(): void {
  chatStore$.personalEmotesVersion.set(version => version + 1);
}
