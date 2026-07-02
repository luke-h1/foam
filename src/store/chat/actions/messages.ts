import { batch } from '@legendapp/state';

import { getPreferences } from '@app/store/preferenceStore';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';
import {
  type ChatterRole,
  clearMentionLoginIndex,
  registerMentionChatter,
  registerMentionLogin,
  registerMentionLoginsFromParts,
  registerMentionLoginsFromSender,
} from '@app/utils/chat/resolveMentionLogin';

import { chatStore$ } from '../observables/chatStore';
import {
  deletePersistedRecentMessagesForChannels,
  RECENT_MESSAGES_PERSISTENCE_ENABLED,
  writePersistedRecentMessagesForChannel,
} from '../observables/recentMessagesPersistence';
import type { AnyChatMessageType } from '../types/constants';
import {
  clearMessageColorIndexes,
  getMessageColor as getIndexedMessageColor,
  getUserMessageColor,
  indexMessageColor,
  removeMessageColor,
} from './messageColorIndex';

const messageKeySet = new Set<string>();
const messageKeyOrder: string[] = [];
const messageIdToIndex = new Map<string, number>();
const messageKeyToIndex = new Map<string, number>();
const DEFAULT_MAX_CHAT_MESSAGES = 150;
const MAX_RECENT_MESSAGES = 80;

export const getMaxChatMessages = (): number =>
  getPreferences().chatScrollback ?? DEFAULT_MAX_CHAT_MESSAGES;

// Trimming the front of the window shifts every row index. While the user is
// scrolled up, LegendList runs native maintainVisibleContentPosition
// (index-anchored at minIndexForVisible: 0); a front-trim re-anchors it to a
// now-different index 0 and yanks the list to the top. So while paused we stop
// front-trimming and let the window grow to a bounded ceiling, then resume (and
// catch up) once the user returns to the bottom where trimming is safe.
const SUSPENDED_FRONT_TRIM_HEADROOM = 350;
let frontTrimSuspended = false;

export const setChatFrontTrimSuspended = (suspended: boolean): void => {
  frontTrimSuspended = suspended;
};

const getEffectiveMaxChatMessages = (): number =>
  getMaxChatMessages() +
  (frontTrimSuspended ? SUSPENDED_FRONT_TRIM_HEADROOM : 0);
const MAX_RECENT_MESSAGE_CHANNELS = 10;
// Each sync re-serializes recentMessagesByChannel to MMKV, which showed up
// as a top JS hotspot in busy chats (issue #594). Recent messages are a
// re-entry nicety, so a long defer is fine; moderation/clear paths still
// flush immediately.
export const RECENT_MESSAGES_SYNC_DELAY_MS = 15_000;

let recentMessagesSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRecentMessagesChannelId: string | null = null;
let pendingRecentMessages: AnyChatMessageType[] | null = null;

const normaliseMessageIdentifier = (value: string): string => value.trim();

const getMessageKey = (messageId: string, messageNonce: string): string =>
  `${normaliseMessageIdentifier(messageId)}_${normaliseMessageIdentifier(
    messageNonce,
  )}`;

const getNormalisedMessageId = (message: AnyChatMessageType): string =>
  message.id?.trim() ? message.id.trim() : '';

const getMessageStoreId = (message: AnyChatMessageType): string =>
  getNormalisedMessageId(message) ||
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
  if (!message) {
    return false;
  }

  return Boolean(
    normaliseMessageIdentifier(message.message_id) &&
    normaliseMessageIdentifier(message.message_nonce),
  );
};

const getSenderChatterRole = (
  message: AnyChatMessageType,
): ChatterRole | undefined => {
  const badgesRaw = message.userstate?.['badges-raw'] ?? '';
  if (badgesRaw.includes('broadcaster/')) {
    return 'broadcaster';
  }
  if (message.userstate?.mod === '1' || badgesRaw.includes('moderator/')) {
    return 'moderator';
  }
  if (badgesRaw.includes('vip/')) {
    return 'vip';
  }
  return undefined;
};

const indexMessage = (message: AnyChatMessageType, index: number) => {
  const key = getMessageKey(message.message_id, message.message_nonce);
  messageKeyToIndex.set(key, index);

  const normalisedMessageId = normaliseMessageIdentifier(message.message_id);
  if (normalisedMessageId) {
    messageIdToIndex.set(normalisedMessageId, index);
  }

  indexMessageColor(message);

  registerMentionChatter({
    login: message.userstate?.login ?? message.sender,
    userId: message.userstate?.['user-id'],
    color: message.userstate?.color,
    role: getSenderChatterRole(message),
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
    chatStore$.recentMessagesByChannel.peek() ?? {};
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

  if (RECENT_MESSAGES_PERSISTENCE_ENABLED) {
    const keptChannelIds = new Set(nextEntries.map(([channelId]) => channelId));
    const droppedChannelIds: string[] = [];
    for (const [channelId] of entries) {
      if (!keptChannelIds.has(channelId)) {
        droppedChannelIds.push(channelId);
      }
    }
    if (droppedChannelIds.length > 0) {
      deletePersistedRecentMessagesForChannels(droppedChannelIds);
    }
  }

  chatStore$.recentMessagesByChannel.set(Object.fromEntries(nextEntries));
};

const persistRecentMessagesForChannel = (
  channelId: string,
  nextMessages: AnyChatMessageType[],
) => {
  const recentMessagesByChannel =
    chatStore$.recentMessagesByChannel.peek() ?? {};
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

  chatStore$.recentMessagesByChannel.set({
    ...recentMessagesByChannel,
    [channelId]: nextRecentMessages,
  });
  // Native persistence is per-channel, so only the channel that changed is
  // serialized + written here (web persists the whole node via Legend State).
  if (RECENT_MESSAGES_PERSISTENCE_ENABLED) {
    writePersistedRecentMessagesForChannel(channelId, nextRecentMessages);
  }
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

const trimMessageIndexes = (): number => {
  let trimmedCount = 0;
  const maxChatMessages = getEffectiveMaxChatMessages();

  while (messageKeyOrder.length > maxChatMessages) {
    const removedKey = messageKeyOrder.shift();
    if (removedKey) {
      messageKeySet.delete(removedKey);
      trimmedCount += 1;
    }
  }

  return trimmedCount;
};

const appendToMessageWindow = (
  currentMessages: AnyChatMessageType[],
  storedMessages: AnyChatMessageType[],
): {
  droppedMessages: AnyChatMessageType[];
  nextMessages: AnyChatMessageType[];
} => {
  const nextMessages = [...currentMessages, ...storedMessages];
  const extraMessageCount = nextMessages.length - getEffectiveMaxChatMessages();

  if (extraMessageCount <= 0) {
    return { droppedMessages: [], nextMessages };
  }

  return {
    droppedMessages: nextMessages.slice(0, extraMessageCount),
    nextMessages: nextMessages.slice(extraMessageCount),
  };
};

const shiftMessageIndexes = (offset: number) => {
  if (offset <= 0) {
    return;
  }

  messageKeyToIndex.forEach((index, key) => {
    messageKeyToIndex.set(key, index - offset);
  });
  messageIdToIndex.forEach((index, key) => {
    messageIdToIndex.set(key, index - offset);
  });
};

// Once the window is full, every flush trims from the front. A full
// rebuildMessageIndexes there re-ran the mention/color registrations for the
// whole window (iterating every part of every message) ~10x/s on busy chats;
// dropping the evicted entries and shifting the survivors is pure Map work.
const indexAppendedMessages = (
  storedMessages: AnyChatMessageType[],
  appendStartIndex: number,
  droppedMessages: AnyChatMessageType[],
) => {
  droppedMessages.forEach((message, droppedIndex) => {
    const key = getMessageKey(message.message_id, message.message_nonce);
    messageKeyToIndex.delete(key);

    const normalisedMessageId = normaliseMessageIdentifier(message.message_id);
    // Another window entry can share this message_id under a different
    // nonce; only drop the id entry when it still points at the evicted row.
    if (
      normalisedMessageId &&
      messageIdToIndex.get(normalisedMessageId) === droppedIndex
    ) {
      messageIdToIndex.delete(normalisedMessageId);
    }

    removeMessageColor(message.message_id);
  });

  shiftMessageIndexes(droppedMessages.length);

  storedMessages.forEach((message, index) => {
    const windowIndex = appendStartIndex + index - droppedMessages.length;
    if (windowIndex >= 0) {
      indexMessage(message, windowIndex);
    }
  });
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
  const { droppedMessages, nextMessages } = appendToMessageWindow(
    currentMessages,
    [storedMessage],
  );

  const trimmedKeyCount = trimMessageIndexes();
  if (trimmedKeyCount === droppedMessages.length) {
    indexAppendedMessages([storedMessage], nextMessageIndex, droppedMessages);
  } else {
    // Key order diverged from the window (shouldn't happen) — resync fully.
    rebuildMessageIndexes(nextMessages);
  }

  chatStore$.messages.set(nextMessages);
  // Defer the MMKV persist (matching addMessages) so a single message never
  // triggers a synchronous full-store stringify+write of recentMessagesByChannel
  // on the hot path; the recent-messages cache is only a warm-start aid.
  syncRecentMessagesForCurrentChannel(nextMessages, 'defer');
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
  const { droppedMessages, nextMessages } = appendToMessageWindow(
    currentMessages,
    storedMessages,
  );

  const trimmedKeyCount = trimMessageIndexes();
  if (trimmedKeyCount === droppedMessages.length) {
    indexAppendedMessages(
      storedMessages,
      nextMessageStartIndex,
      droppedMessages,
    );
  } else {
    // Key order diverged from the window (shouldn't happen) — resync fully.
    rebuildMessageIndexes(nextMessages);
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

export const removeMessagesByLogin = (login: string) => {
  const target = normaliseLogin(login);
  if (!target) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  const removedMessages: AnyChatMessageType[] = [];
  const nextMessages = currentMessages.filter(message => {
    if (!isValidChatMessage(message)) {
      return true;
    }

    const messageLogin = normaliseLogin(
      message.userstate?.login || message.userstate?.username || message.sender,
    );

    if (messageLogin !== target) {
      return true;
    }

    removedMessages.push(message);
    return false;
  });

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

  rebuildMessageIndexes(nextMessages);
  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

export const getMessageById = (
  messageId: string,
): AnyChatMessageType | undefined => {
  const index = messageIdToIndex.get(normaliseMessageIdentifier(messageId));
  if (typeof index !== 'number') {
    return undefined;
  }

  return chatStore$.messages.peek()[index];
};

export const removeMessageById = (messageId: string) => {
  const normalisedMessageId = normaliseMessageIdentifier(messageId);
  if (!normalisedMessageId) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  const removedMessages = currentMessages.filter(
    message =>
      isValidChatMessage(message) &&
      normaliseMessageIdentifier(message.message_id) === normalisedMessageId,
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
    message =>
      !isValidChatMessage(message) ||
      normaliseMessageIdentifier(message.message_id) !== normalisedMessageId,
  );

  rebuildMessageIndexes(nextMessages);
  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

export const clearMessages = () => {
  flushPendingRecentMessagesSync();
  frontTrimSuspended = false;
  messageKeySet.clear();
  messageKeyOrder.length = 0;
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  clearMessageColorIndexes();
  clearMentionLoginIndex();
  chatStore$.messages.set([]);
};

export const clearMessagesWithNotice = (notice: AnyChatMessageType) => {
  // One batch so observers never see the empty intermediate state.
  batch(() => {
    clearMessages();
    addMessage(notice);
  });
};

export const restoreRecentMessagesForChannel = (channelId: string): number => {
  const recentMessages = dedupeMessagesForStore(
    chatStore$.recentMessagesByChannel[channelId]?.peek() ?? [],
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
