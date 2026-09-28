import { useMemo } from 'react';

import type { ChatIrcHandlerDeps } from '../util/create-chat-irc-handlers';
import { createChatIrcHandlers } from '../util/create-chat-irc-handlers';
import { createRoomStateTracker } from '../util/room-state/room-state-tracker';

type UseChatIrcHandlersOptions = Omit<ChatIrcHandlerDeps, 'roomStateTracker'>;

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
  /**
   * Keyed to the channel: the PART echo for the old room is not guaranteed to
   * arrive on a switch, so the reset must not depend on it.
   */
  const roomStateTracker = useMemo(
    () => createRoomStateTracker(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId],
  );

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
