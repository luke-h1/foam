import type { AnyChatMessageType } from '@app/types/chat/chatMessage';

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
