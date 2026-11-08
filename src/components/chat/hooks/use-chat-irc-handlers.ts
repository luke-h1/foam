import { useMemo } from 'react';

import type { ChatIrcHandlerDeps } from '../util/createChatIrcHandlers';
import { createChatIrcHandlers } from '../util/createChatIrcHandlers';
import { createRoomStateTracker } from '../util/room-state/roomStateTracker';

type UseChatIrcHandlersOptions = Omit<ChatIrcHandlerDeps, 'roomStateTracker'>;

/**
 * Consumers read the handlers through refs, so a new handler set per options
 * object is safe.
 */
export function useChatIrcHandlers(options: UseChatIrcHandlersOptions) {
  /**
   * Keyed to the channel: the PART echo for the old room is not guaranteed to
   * arrive on a switch, so the reset must not depend on it.
   */
  const roomStateTracker = useMemo(
    () => createRoomStateTracker(),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the id is the reset key; the factory does not read it
    [options.channelId],
  );

  return createChatIrcHandlers({ ...options, roomStateTracker });
}
