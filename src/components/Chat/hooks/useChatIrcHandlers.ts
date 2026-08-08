import { useMemo } from 'react';

import type { ChatIrcHandlerDeps } from '../util/createChatIrcHandlers';
import { createChatIrcHandlers } from '../util/createChatIrcHandlers';
import { createRoomStateTracker } from '../util/roomState/roomStateTracker';

type UseChatIrcHandlersOptions = Omit<ChatIrcHandlerDeps, 'roomStateTracker'>;

/**
 * The room-state tracker is deliberately mount-scoped, not per-channel:
 * `onPart` resets it on channel switches.
 */
export function useChatIrcHandlers({
  channelId,
  channelName,
  clearLocalMessages,
  enqueueLiveChatMessage,
  handleNewMessage,
  isMountedRef,
  isLoadingRecentMessagesRef,
  listRef,
  messages$,
  moderateChatMessageById,
  moderateChatMessagesByLogin,
  processMessageEmotes,
  removeChatMessageById,
  removeChatMessagesByLogin,
}: UseChatIrcHandlersOptions) {
  const roomStateTracker = useMemo(() => createRoomStateTracker(), []);

  return useMemo(
    () =>
      createChatIrcHandlers({
        channelId,
        channelName,
        clearLocalMessages,
        enqueueLiveChatMessage,
        handleNewMessage,
        isMountedRef,
        isLoadingRecentMessagesRef,
        listRef,
        messages$,
        moderateChatMessageById,
        moderateChatMessagesByLogin,
        processMessageEmotes,
        removeChatMessageById,
        removeChatMessagesByLogin,
        roomStateTracker,
      }),
    [
      channelId,
      channelName,
      clearLocalMessages,
      enqueueLiveChatMessage,
      handleNewMessage,
      isMountedRef,
      isLoadingRecentMessagesRef,
      listRef,
      messages$,
      moderateChatMessageById,
      moderateChatMessagesByLogin,
      processMessageEmotes,
      removeChatMessageById,
      removeChatMessagesByLogin,
      roomStateTracker,
    ],
  );
}
