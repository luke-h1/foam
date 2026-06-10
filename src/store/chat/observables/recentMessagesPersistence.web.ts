import type { AnyChatMessageType } from '../types/constants';

// Web keeps the Legend State IndexedDB persistence for recentMessagesByChannel
// (see chatStore.ts), so these are no-ops. The flag is statically false here, so
// the native MMKV branch is dead-code-eliminated from the web bundle.
export const RECENT_MESSAGES_PERSISTENCE_ENABLED = false;

export const loadPersistedRecentMessages = (): Record<
  string,
  AnyChatMessageType[]
> => ({});

export const writePersistedRecentMessagesForChannel = (
  _channelId: string,
  _messages: AnyChatMessageType[],
): void => {};

export const deletePersistedRecentMessagesForChannels = (
  _channelIds: readonly string[],
): void => {};

export const clearPersistedRecentMessages = (): void => {};
