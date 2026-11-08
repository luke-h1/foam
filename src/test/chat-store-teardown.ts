import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { flushPendingRecentMessagesSync } from '@app/store/chat/actions/messages';
import { flushPersistedChannelCacheWrites } from '@app/store/chat/observables/channel-cache-persistence';

/**
 * Runs the owners of the chat store debounces, so a test file that seeds the
 * store leaves no real timer behind. Use it in `afterEach`.
 */
export function flushChatStoreTimers(): void {
  flushPendingRecentMessagesSync();
  clearUserCosmeticsCache();
  flushPersistedChannelCacheWrites();
}
