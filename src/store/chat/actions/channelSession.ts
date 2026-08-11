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
 * The four ways a channel session ends. `leave` is the navigation
 * `beforeRemove` (surface stays mounted for the outro), `unmount` is the chat
 * surface going away, `switch` is an in-place channel change on a mounted
 * surface, and `part` is the IRC PART echo for the current room.
 */
export type ChannelSessionResetTrigger =
  'leave' | 'unmount' | 'switch' | 'part';

/**
 * The one owner of the module-level resets a channel switch requires. The
 * per-trigger lists were previously spread over ~9 owners across four
 * triggers, which let them drift; anything armed by a hook (scroll timers,
 * buffers, socket refs) stays with its structural owner and is NOT reset
 * here.
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
