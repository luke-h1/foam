import { useMemo } from 'react';

import type { ChatIrcHandlerDeps } from '../util/createChatIrcHandlers';
import { createChatIrcHandlers } from '../util/createChatIrcHandlers';
import { createRoomStateTracker } from '../util/roomState/roomStateTracker';

type UseChatIrcHandlersOptions = Omit<ChatIrcHandlerDeps, 'roomStateTracker'>;

/**
 * Thin memoizing wrapper over `createChatIrcHandlers`: owns the per-channel
 * room-state tracker and keeps handler identity stable for the IRC transport.
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
