import {
  abortCurrentLoad,
  clearChannelResources,
  clearPersonalEmotesCache,
} from '@app/store/chat/actions/channel-load';
import { clearMentionSessionCaches } from '@app/store/chat/actions/chat-color-caches';
import { clearPaintBindings } from '@app/store/chat/actions/cosmetics';
import { clearMessages } from '@app/store/chat/actions/messages';
import { clearFetchedCosmeticsUsers } from '@app/store/chat/actions/user-cosmetics-fetch';
import { clearVisibleAssetHydration } from '@app/store/chat/actions/visible-asset-hydration';
import { resetMentionLoginResolver } from '@app/utils/chat/mention-login-resolver/reset-mention-login-resolver';

export type ChannelSessionResetTrigger =
  'leave' | 'unmount' | 'switch' | 'token';

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
    case 'token': {
      clearMessages();
      break;
    }
  }
}
