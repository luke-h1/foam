import { useMemo } from 'react';

import type { ChatIrcHandlerDeps } from '../util/createChatIrcHandlers';
import { createChatIrcHandlers } from '../util/createChatIrcHandlers';
import { createRoomStateTracker } from '../util/roomState/roomStateTracker';

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
   * Keyed to the channel: `onPart` also resets the tracker, but the PART echo
   * for the old room is not guaranteed to arrive on a channel switch (the
   * socket can be dead mid-switch), so a switch must not depend on it.
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
