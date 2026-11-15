import { useSelector } from '@legendapp/state/react';

import {
  chatOverlays$,
  type ChatOverlayState,
  createEmptyChatOverlayState,
} from '@app/store/chat/observables/chat-overlays';

export function useChatOverlayState(channelId: string): ChatOverlayState {
  const overlay = useSelector(chatOverlays$);

  return overlay.channelId === channelId
    ? overlay
    : createEmptyChatOverlayState(channelId);
}
