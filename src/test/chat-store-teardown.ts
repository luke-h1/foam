import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import { flushPendingRecentMessagesSync } from '@app/store/chat/actions/messages';
import { flushPersistedChannelCacheWrites } from '@app/store/chat/observables/channel-cache-persistence';

export function flushChatStoreTimers(): void {
  flushPendingRecentMessagesSync();
  clearUserCosmeticsCache();
  flushPersistedChannelCacheWrites();
}
