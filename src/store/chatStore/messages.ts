import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';
import {
  clearMessageColorIndexes,
  getMessageColor as getIndexedMessageColor,
  getUserMessageColor,
  indexMessageColor,
} from './messageColorIndex';
import {
  clearMentionLoginIndex,
  registerMentionChatter,
  registerMentionLogin,
  registerMentionLoginsFromParts,
  registerMentionLoginsFromSender,
} from '@app/utils/chat/resolveMentionLogin';
import type { AnyChatMessageType } from './constants';
import { chatStore$ } from './state';

const messageKeySet = new Set<string>();
const messageKeyOrder: string[] = [];
const messageIdToIndex = new Map<string, number>();
const messageKeyToIndex = new Map<string, number>();
const MAX_CHAT_MESSAGES = 600;
const MAX_RECENT_MESSAGES = 80;
const MAX_RECENT_MESSAGE_CHANNELS = 10;
const RECENT_MESSAGES_SYNC_DELAY_MS = 1000;

let recentMessagesSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRecentMessagesChannelId: string | null = null;
let pendingRecentMessages: AnyChatMessageType[] | null = null;

const getMessageKey = (messageId: string, messageNonce: string): string =>
  `${messageId}_${messageNonce}`;

const getMessageStoreId = (message: AnyChatMessageType): string =>
  message.id?.trim() ||
  getMessageKey(message.message_id, message.message_nonce);

const dedupeMessagesForStore = (
  messages: (AnyChatMessageType | undefined)[],
): AnyChatMessageType[] => {
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();
  const uniqueMessages: AnyChatMessageType[] = [];

  messages.forEach(message => {
    if (!isValidChatMessage(message)) {
      return;
    }

    const key = getMessageKey(message.message_id, message.message_nonce);
    const id = getMessageStoreId(message);
    if (seenKeys.has(key) || seenIds.has(id)) {
      return;
    }

    seenKeys.add(key);
    seenIds.add(id);
    uniqueMessages.push(message);
  });

  return uniqueMessages;
};

const prepareMessagePartsForStore = (
  messageId: string,
  messageNonce: string,
  messageParts: AnyChatMessageType['message'],
): AnyChatMessageType['message'] => {
  const messageKey = getMessageKey(messageId, messageNonce);
  return messageParts.map((part, index) => {
    const storedPart = { ...part };
    Object.defineProperty(storedPart, 'id', {
      configurable: true,
      enumerable: false,
      value: `${messageKey}:${index}`,
      writable: true,
    });
    return storedPart;
  });
};

const prepareMessageForStore = (
  message: AnyChatMessageType,
): AnyChatMessageType => {
  const messageKey = getMessageKey(message.message_id, message.message_nonce);
  const cachedSenderColor = resolveCachedSenderColor(
    message,
    getUserMessageColor,
  );
  return {
    ...message,
    id: messageKey,
    ...(cachedSenderColor ? { cachedSenderColor } : {}),
    message: prepareMessagePartsForStore(
      message.message_id,
      message.message_nonce,
      message.message,
    ),
  };
};

const prepareMessageUpdates = (
  messageId: string,
  messageNonce: string,
  updates: Partial<
    Pick<AnyChatMessageType, 'message' | 'badges' | 'moderationNotice'>
  >,
) =>
  updates.message
    ? {
        ...updates,
        message: prepareMessagePartsForStore(
          messageId,
          messageNonce,
          updates.message,
        ),
      }
    : updates;

const isValidChatMessage = (
  message?: AnyChatMessageType,
): message is AnyChatMessageType => {
  return Boolean(message?.message_id && message.message_nonce);
};

const indexMessage = (message: AnyChatMessageType, index: number) => {
  const key = getMessageKey(message.message_id, message.message_nonce);
  messageKeyToIndex.set(key, index);

  if (message.message_id) {
    messageIdToIndex.set(message.message_id, index);
  }

  indexMessageColor(message);

  registerMentionChatter({
    login: message.userstate?.login ?? message.sender,
    userId: message.userstate?.['user-id'],
    color: message.userstate?.color,
  });
  registerMentionLoginsFromSender(
    message.userstate?.login,
    message.userstate?.username ?? message.sender,
  );
  registerMentionLogin(message.replyDisplayName);
  registerMentionLoginsFromParts(message.message);
};

const rebuildMessageIndexes = (
  messages: AnyChatMessageType[] = chatStore$.messages.peek(),
) => {
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  clearMessageColorIndexes();

  messages.forEach((message, index) => {
    if (isValidChatMessage(message)) {
      indexMessage(message, index);
    }
  });
};

const trimRecentMessageChannels = () => {
  const recentMessagesByChannel =
    chatStore$.persisted.recentMessagesByChannel.peek() ?? {};
  const entries = Object.entries(recentMessagesByChannel);

  if (entries.length <= MAX_RECENT_MESSAGE_CHANNELS) {
    return;
  }

  const currentChannelId = chatStore$.currentChannelId.peek();
  const nextEntries = entries.slice(-MAX_RECENT_MESSAGE_CHANNELS);

  if (currentChannelId) {
    const currentEntryIndex = entries.findIndex(
      ([channelId]) => channelId === currentChannelId,
    );
    const currentEntry =
      currentEntryIndex >= 0 ? entries[currentEntryIndex] : undefined;

    if (
      currentEntry &&
      !nextEntries.some(([channelId]) => channelId === currentChannelId)
    ) {
      nextEntries[0] = currentEntry;
    }
  }

  chatStore$.persisted.recentMessagesByChannel.set(
    Object.fromEntries(nextEntries),
  );
};

const persistRecentMessagesForChannel = (
  channelId: string,
  nextMessages: AnyChatMessageType[],
) => {
  const recentMessagesByChannel =
    chatStore$.persisted.recentMessagesByChannel.peek() ?? {};
  const existingMessages = recentMessagesByChannel[channelId];
  if (existingMessages === nextMessages) {
    return;
  }

  const nextRecentMessages = nextMessages.slice(-MAX_RECENT_MESSAGES);
  if (
    existingMessages &&
    existingMessages.length === nextRecentMessages.length &&
    existingMessages.every(
      (message, index) => message === nextRecentMessages[index],
    )
  ) {
    return;
  }

  chatStore$.persisted.recentMessagesByChannel.set({
    ...recentMessagesByChannel,
    [channelId]: nextRecentMessages,
  });
  trimRecentMessageChannels();
};

const flushPendingRecentMessagesSync = () => {
  if (recentMessagesSyncTimer) {
    clearTimeout(recentMessagesSyncTimer);
    recentMessagesSyncTimer = null;
  }

  const channelId = pendingRecentMessagesChannelId;
  const nextMessages = pendingRecentMessages;

  pendingRecentMessagesChannelId = null;
  pendingRecentMessages = null;

  if (!channelId || !nextMessages) {
    return;
  }

  persistRecentMessagesForChannel(channelId, nextMessages);
};

const syncRecentMessagesForCurrentChannel = (
  nextMessages: AnyChatMessageType[],
  mode: 'defer' | 'immediate' = 'immediate',
) => {
  const currentChannelId = chatStore$.currentChannelId.peek();
  if (!currentChannelId) {
    return;
  }

  if (mode === 'immediate') {
    flushPendingRecentMessagesSync();
    persistRecentMessagesForChannel(currentChannelId, nextMessages);
    return;
  }

  pendingRecentMessagesChannelId = currentChannelId;
  pendingRecentMessages = nextMessages.slice(-MAX_RECENT_MESSAGES);

  if (recentMessagesSyncTimer) {
    return;
  }

  recentMessagesSyncTimer = setTimeout(
    flushPendingRecentMessagesSync,
    RECENT_MESSAGES_SYNC_DELAY_MS,
  );
};

const trimMessageIndexes = (): boolean => {
  let didTrim = false;

  while (messageKeyOrder.length > MAX_CHAT_MESSAGES) {
    const removedKey = messageKeyOrder.shift();
    if (removedKey) {
      messageKeySet.delete(removedKey);
      didTrim = true;
    }
  }

  return didTrim;
};

const appendToMessageWindow = (
  currentMessages: AnyChatMessageType[],
  storedMessages: AnyChatMessageType[],
): {
  didTrimMessages: boolean;
  nextMessages: AnyChatMessageType[];
} => {
  const nextMessages = [...currentMessages, ...storedMessages];
  const extraMessageCount = nextMessages.length - MAX_CHAT_MESSAGES;

  if (extraMessageCount <= 0) {
    return { didTrimMessages: false, nextMessages };
  }

  return {
    didTrimMessages: true,
    nextMessages: nextMessages.slice(extraMessageCount),
  };
};

const publishMessageAtIndex = (
  index: number,
  message: AnyChatMessageType,
  mode: 'defer' | 'immediate' = 'defer',
) => {
  const currentMessages = chatStore$.messages.peek();
  if (!currentMessages[index]) {
    return;
  }

  const nextMessages = currentMessages.slice();
  nextMessages[index] = message;
  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages, mode);
};

type MessageUpdateInput = {
  messageId: string;
  messageNonce: string;
  updates: Partial<
    Pick<AnyChatMessageType, 'message' | 'badges' | 'moderationNotice'>
  >;
};

const getMessageUpdatesFromInputs = (
  currentMessages: AnyChatMessageType[],
  updates: MessageUpdateInput[],
): AnyChatMessageType[] | null => {
  let nextMessages = currentMessages;
  let didUpdate = false;

  for (const { messageId, messageNonce, updates: messageUpdates } of updates) {
    const key = getMessageKey(messageId, messageNonce);
    const index = messageKeyToIndex.get(key);

    if (typeof index !== 'number') {
      continue;
    }

    const currentMessage = nextMessages[index];
    if (!currentMessage) {
      continue;
    }

    const preparedUpdates = prepareMessageUpdates(
      messageId,
      messageNonce,
      messageUpdates,
    );

    if (nextMessages === currentMessages) {
      nextMessages = currentMessages.slice();
    }

    nextMessages[index] = {
      ...currentMessage,
      ...preparedUpdates,
    };
    didUpdate = true;
  }

  return didUpdate ? nextMessages : null;
};

export const updateMessages = (
  updates: MessageUpdateInput[],
  mode: 'defer' | 'immediate' = 'defer',
) => {
  if (updates.length === 0) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  const nextMessages = getMessageUpdatesFromInputs(currentMessages, updates);
  if (!nextMessages) {
    return;
  }

  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages, mode);
};

export const addMessage = (message?: AnyChatMessageType) => {
  if (!isValidChatMessage(message)) {
    return;
  }

  const key = getMessageKey(message.message_id, message.message_nonce);
  if (messageKeySet.has(key)) {
    return;
  }

  const storedMessage = prepareMessageForStore(message);
  messageKeySet.add(key);
  messageKeyOrder.push(key);
  const currentMessages = chatStore$.messages.peek();
  const nextMessageIndex = currentMessages.length;
  const { didTrimMessages, nextMessages } = appendToMessageWindow(
    currentMessages,
    [storedMessage],
  );

  const didTrimIndexes = trimMessageIndexes();
  if (didTrimIndexes || didTrimMessages) {
    rebuildMessageIndexes(nextMessages);
  } else {
    indexMessage(storedMessage, nextMessageIndex);
  }

  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

export const addMessages = (messages: (AnyChatMessageType | undefined)[]) => {
  if (messages.length === 0) {
    return;
  }
  const newMessages = messages.filter((msg): msg is AnyChatMessageType => {
    if (!isValidChatMessage(msg)) {
      return false;
    }

    const key = getMessageKey(msg.message_id, msg.message_nonce);
    if (messageKeySet.has(key)) {
      return false;
    }
    messageKeySet.add(key);
    messageKeyOrder.push(key);
    return true;
  });

  if (newMessages.length === 0) {
    return;
  }

  const storedMessages = newMessages.map(prepareMessageForStore);
  const currentMessages = chatStore$.messages.peek();
  const nextMessageStartIndex = currentMessages.length;
  const { didTrimMessages, nextMessages } = appendToMessageWindow(
    currentMessages,
    storedMessages,
  );

  const didTrimIndexes = trimMessageIndexes();
  if (didTrimIndexes || didTrimMessages) {
    rebuildMessageIndexes(nextMessages);
  } else {
    storedMessages.forEach((message, index) => {
      indexMessage(message, nextMessageStartIndex + index);
    });
  }

  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages, 'defer');
};

function normaliseLogin(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function createModeratedText(
  message: AnyChatMessageType,
  moderationNotice: string,
): string {
  const plainText = replaceEmotesWithText(message.message).trim();
  return plainText ? `${plainText}\u2014${moderationNotice}` : moderationNotice;
}

export const moderateMessageById = (
  messageId: string,
  moderationNotice: string,
) => {
  const message = getMessageById(messageId);
  if (!message) {
    return;
  }

  const key = getMessageKey(message.message_id, message.message_nonce);
  const index = messageKeyToIndex.get(key);

  if (typeof index !== 'number') {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  const currentMessage = currentMessages[index];
  if (!currentMessage) {
    return;
  }

  publishMessageAtIndex(
    index,
    {
      ...currentMessage,
      ...prepareMessageUpdates(
        currentMessage.message_id,
        currentMessage.message_nonce,
        {
          message: [
            {
              type: 'text',
              content: createModeratedText(currentMessage, moderationNotice),
            },
          ],
        },
      ),
      moderationNotice,
    },
    'immediate',
  );
};

export const moderateMessagesByLogin = (
  login: string,
  moderationNotice: string,
) => {
  const target = normaliseLogin(login);
  if (!target) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  let didModerateMessages = false;
  const nextMessages = currentMessages.slice();

  for (let index = 0; index < currentMessages.length; index += 1) {
    const message = currentMessages[index];
    if (!isValidChatMessage(message)) {
      continue;
    }

    const messageLogin = normaliseLogin(
      message.userstate?.login || message.userstate?.username || message.sender,
    );

    if (messageLogin !== target) {
      continue;
    }

    didModerateMessages = true;

    nextMessages[index] = {
      ...message,
      ...prepareMessageUpdates(message.message_id, message.message_nonce, {
        message: [
          {
            type: 'text',
            content: createModeratedText(message, moderationNotice),
          },
        ],
      }),
      moderationNotice,
    };
  }

  if (!didModerateMessages) {
    return;
  }

  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

export const getMessageById = (
  messageId: string,
): AnyChatMessageType | undefined => {
  const index = messageIdToIndex.get(messageId);
  if (typeof index !== 'number') {
    return undefined;
  }

  return chatStore$.messages.peek()[index];
};

export const removeMessageById = (messageId: string) => {
  if (!messageId.trim()) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  const removedMessages = currentMessages.filter(
    message => isValidChatMessage(message) && message.message_id === messageId,
  );

  if (removedMessages.length === 0) {
    return;
  }

  removedMessages.forEach(message => {
    const key = getMessageKey(message.message_id, message.message_nonce);
    messageKeySet.delete(key);

    const orderIndex = messageKeyOrder.indexOf(key);
    if (orderIndex >= 0) {
      messageKeyOrder.splice(orderIndex, 1);
    }
  });

  const nextMessages = currentMessages.filter(
    message => !isValidChatMessage(message) || message.message_id !== messageId,
  );

  rebuildMessageIndexes(nextMessages);
  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

export const clearMessages = () => {
  flushPendingRecentMessagesSync();
  messageKeySet.clear();
  messageKeyOrder.length = 0;
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  clearMessageColorIndexes();
  clearMentionLoginIndex();
  chatStore$.messages.set([]);
};

export const restoreRecentMessagesForChannel = (channelId: string): number => {
  const recentMessages = dedupeMessagesForStore(
    chatStore$.persisted.recentMessagesByChannel[channelId]?.peek() ?? [],
  );

  if (recentMessages.length === 0) {
    clearMessages();
    return 0;
  }

  messageKeySet.clear();
  messageKeyOrder.length = 0;
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  clearMessageColorIndexes();
  clearMentionLoginIndex();

  recentMessages.forEach(message => {
    const key = getMessageKey(message.message_id, message.message_nonce);
    messageKeySet.add(key);
    messageKeyOrder.push(key);
  });

  const storedMessages = recentMessages.map(prepareMessageForStore);
  rebuildMessageIndexes(storedMessages);
  chatStore$.messages.set(storedMessages);

  return recentMessages.length;
};

export const getMessageColor = (messageId: string): string | undefined =>
  getIndexedMessageColor(messageId);

export { getUserMessageColor } from './messageColorIndex';

export const clearTtvUsers = () => {
  chatStore$.ttvUsers.set([]);
};
