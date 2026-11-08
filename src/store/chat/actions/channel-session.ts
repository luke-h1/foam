import {
  abortCurrentLoad,
  clearChannelResources,
  clearPersistedChatResources,
} from '@app/store/chat/actions/channel-load';
import { clearChannelPointRewardTitles } from '@app/store/chat/actions/channelPointRewardTitleStore';
import { clearMentionSessionCaches } from '@app/store/chat/actions/chat-color-caches';
import {
  clearPaintBindings,
  clearUserCosmeticsCache,
  flushCosmeticsPersist,
} from '@app/store/chat/actions/cosmetics';
import { resetMentionLogins } from '@app/store/chat/actions/mention-login-lookup';
import {
  clearMessages,
  flushPendingRecentMessagesSync,
} from '@app/store/chat/actions/messages';
import { clearPersonalEmotesCache } from '@app/store/chat/actions/personal-emotes';
import { clearFetchedCosmeticsUsers } from '@app/store/chat/actions/user-cosmetics-fetch';
import { clearVisibleAssetHydration } from '@app/store/chat/actions/visible-asset-hydration';
import { flushPersistedChannelCacheWrites } from '@app/store/chat/observables/channel-cache-persistence';

export type ChannelSessionResetTrigger =
  | 'leave'
  | 'unmount'
  | 'switch'
  | 'part'
  | 'clear-cosmetics'
  | 'clear-cache';

/**
 * A cleared cosmetics cache also forgets which users were fetched, or those
 * users never fetch their paint and badge again.
 */
function clearCosmeticsSession(): void {
  clearUserCosmeticsCache();
  clearFetchedCosmeticsUsers();
}

/**
 * The one owner of the module-level resets a channel switch or a cache clear
 * requires. Store debounces are flushed here; anything armed by a hook
 * (buffers, socket refs) is NOT reset here.
 */
export function resetChannelSession(trigger: ChannelSessionResetTrigger): void {
  switch (trigger) {
    case 'leave': {
      abortCurrentLoad();
      flushPendingRecentMessagesSync();
      clearChannelResources();
      clearMentionSessionCaches();
      break;
    }
    case 'unmount': {
      abortCurrentLoad();
      flushPendingRecentMessagesSync();
      clearChannelResources();
      clearPaintBindings();
      flushCosmeticsPersist();
      flushPersistedChannelCacheWrites();
      clearPersonalEmotesCache();
      clearFetchedCosmeticsUsers();
      clearMentionSessionCaches();
      resetMentionLogins();
      clearChannelPointRewardTitles();
      clearVisibleAssetHydration();
      break;
    }
    case 'switch': {
      clearMessages();
      clearMentionSessionCaches();
      resetMentionLogins();
      clearChannelPointRewardTitles();
      clearVisibleAssetHydration();
      break;
    }
    case 'part': {
      clearMessages();
      resetMentionLogins();
      break;
    }
    case 'clear-cosmetics': {
      clearCosmeticsSession();
      break;
    }
    case 'clear-cache': {
      clearPersistedChatResources();
      clearCosmeticsSession();
      clearPersonalEmotesCache();
      clearVisibleAssetHydration();
      break;
    }
  }
}
