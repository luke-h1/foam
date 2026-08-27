import {
  abortCurrentLoad,
  clearChannelResources,
  clearPersonalEmotesCache,
} from '@app/store/chat/actions/channelLoad';
import { clearMentionSessionCaches } from '@app/store/chat/actions/chatColorCaches';
import { clearPaintBindings } from '@app/store/chat/actions/cosmetics';
import { clearMessages } from '@app/store/chat/actions/messages';
import { clearFetchedCosmeticsUsers } from '@app/store/chat/actions/userCosmeticsFetch';
import { clearVisibleAssetHydration } from '@app/store/chat/actions/visibleAssetHydration';
import { resetMentionLoginResolver } from '@app/utils/chat/mentionLoginResolver/resetMentionLoginResolver';

/**
 * The four ways a channel session ends: navigation `beforeRemove`, chat
 * surface unmount, in-place channel switch, and the IRC PART echo.
 */
export type ChannelSessionResetTrigger =
  'leave' | 'unmount' | 'switch' | 'part';

/**
 * The one owner of the module-level resets a channel switch requires; anything
 * armed by a hook (timers, buffers, socket refs) is NOT reset here.
 */
export function resetChannelSession(trigger: ChannelSessionResetTrigger): void {
  switch (trigger) {
    case 'leave': {
      abortCurrentLoad();
      clearChannelResources();
      clearMentionSessionCaches();
      break;
    }
    case 'unmount': {
      abortCurrentLoad();
      clearChannelResources();
      clearPaintBindings();
      clearPersonalEmotesCache();
      clearFetchedCosmeticsUsers();
      clearMentionSessionCaches();
      resetMentionLoginResolver();
      clearVisibleAssetHydration();
      break;
    }
    case 'switch': {
      clearMessages();
      clearMentionSessionCaches();
      clearVisibleAssetHydration();
      break;
    }
    case 'part': {
      clearMessages();
      break;
    }
  }
}
