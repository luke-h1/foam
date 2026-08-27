import { useSelector } from '@legendapp/state/react';

import {
  chatOverlays$,
  type ChatOverlayState,
  createEmptyChatOverlayState,
} from '@app/store/chat/observables/chatOverlays';

/**
 * Only the overlay layer subscribes, so opening a sheet never re-renders the
 * chat root or the message list.
 */
export function useChatOverlayState(channelId: string): ChatOverlayState {
  const overlay = useSelector(chatOverlays$);

  return overlay.channelId === channelId
    ? overlay
    : createEmptyChatOverlayState(channelId);
}
