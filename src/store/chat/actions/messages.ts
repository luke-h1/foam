import { batch } from '@legendapp/state';

import { chatPerfMarks } from '@app/lib/chatPerfMarks';
import { getPreferences } from '@app/store/preferenceStore';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { createModeratedMessageText } from '@app/utils/chat/createModeratedMessageText';
import { getChatMessageKey } from '@app/utils/chat/messageIdentity/getChatMessageKey';
import { getChatMessageStoreId } from '@app/utils/chat/messageIdentity/getChatMessageStoreId';
import { isRenderableChatMessage } from '@app/utils/chat/messageIdentity/isRenderableChatMessage';
import { normaliseMessageField } from '@app/utils/chat/messageIdentity/normaliseMessageField';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor/resolveCachedSenderColor';
import { clearMentionLoginIndex } from '@app/utils/chat/resolveMentionLogin/clearMentionLoginIndex';
import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin/registerMentionChatter';
import { registerMentionLogin } from '@app/utils/chat/resolveMentionLogin/registerMentionLogin';
import { registerMentionLoginsFromParts } from '@app/utils/chat/resolveMentionLogin/registerMentionLoginsFromParts';
import { registerMentionLoginsFromSender } from '@app/utils/chat/resolveMentionLogin/registerMentionLoginsFromSender';
import { type ChatterRole } from '@app/utils/chat/resolveMentionLogin/types';

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
/**
 * Stored positions are absolute and reads subtract this running offset, so a
 * front-trim never rewrites both index Maps per flush.
 */
let windowBaseOffset = 0;
const messageKeyOrder: string[] = [];
const messageIdToIndex = new Map<string, number>();
const messageKeyToIndex = new Map<string, number>();
const DEFAULT_MAX_CHAT_MESSAGES = 150;
const MAX_RECENT_MESSAGES = 80;

export const getMaxChatMessages = (): number =>
  getPreferences().chatScrollback ?? DEFAULT_MAX_CHAT_MESSAGES;

// While scrolled up a front-trim re-anchors index 0 and yanks the list to the
// top, so pause trimming and let the window grow to a bounded ceiling.
const SUSPENDED_FRONT_TRIM_HEADROOM = 350;
let frontTrimSuspended = false;

export const setChatFrontTrimSuspended = (suspended: boolean): void => {
  frontTrimSuspended = suspended;
};

const getEffectiveMaxChatMessages = (): number =>
  getMaxChatMessages() +
  (frontTrimSuspended ? SUSPENDED_FRONT_TRIM_HEADROOM : 0);
const MAX_RECENT_MESSAGE_CHANNELS = 10;
// Each sync re-serializes recentMessagesByChannel to MMKV - a top JS hotspot
// in busy chats (issue #594); moderation/clear paths still flush immediately.
export const RECENT_MESSAGES_SYNC_DELAY_MS = 15_000;

let recentMessagesSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRecentMessagesChannelId: string | null = null;
let pendingRecentMessages: AnyChatMessageType[] | null = null;

const dedupeMessagesForStore = (
  messages: (AnyChatMessageType | undefined)[],
): AnyChatMessageType[] => {
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();
  const uniqueMessages: AnyChatMessageType[] = [];

  messages.forEach(message => {
    if (!isRenderableChatMessage(message)) {
      return;
    }

    const key = getChatMessageKey(message.message_id, message.message_nonce);
    const id = getChatMessageStoreId(message);
    if (seenKeys.has(key) || seenIds.has(id)) {
      return;
    }

    seenKeys.add(key);
    seenIds.add(id);
    uniqueMessages.push(message);
  });

  return uniqueMessages;
};

/**
 * Legend State keys nested array diffs on element `id`s, so parts need
 * distinct ids or child nodes mis-key; non-enumerable so persistence never sees them.
 */
const partIdsAssigned = new WeakSet<AnyChatMessageType['message']>();

const ensurePartIdsForStore = (
  messageParts: AnyChatMessageType['message'],
): AnyChatMessageType['message'] => {
  if (messageParts.length < 2 || partIdsAssigned.has(messageParts)) {
    return messageParts;
  }
  for (let index = 0; index < messageParts.length; index += 1) {
    const part = messageParts[index];
    if (part) {
      Object.defineProperty(part, 'id', {
        configurable: true,
        enumerable: false,
        value: String(index),
        writable: true,
      });
    }
  }
  partIdsAssigned.add(messageParts);
  return messageParts;
};

let nextMessageSeq = 0;

const prepareMessageForStore = (
  message: AnyChatMessageType,
  precomputedKey?: string,
): AnyChatMessageType => {
  const messageKey =
    precomputedKey ??
    getChatMessageKey(message.message_id, message.message_nonce);
  const cachedSenderColor = resolveCachedSenderColor(
    message,
    getUserMessageColor,
  );
  nextMessageSeq += 1;
  const storedMessage: AnyChatMessageType = {
    ...message,
    id: messageKey,
    seq: nextMessageSeq,
    committedAt: message.committedAt ?? Date.now(),
    message: ensurePartIdsForStore(message.message),
  };
  if (cachedSenderColor) {
    storedMessage.cachedSenderColor = cachedSenderColor;
  }
  return storedMessage;
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
  // Stored messages carry the key as their id (prepareMessageForStore), so
  // this is a field read; the fallback covers unprepared messages.
  const key = getChatMessageStoreId(message);
  messageKeyToIndex.set(key, index + windowBaseOffset);

  const normalisedMessageId = normaliseMessageField(message.message_id);
  if (normalisedMessageId) {
    messageIdToIndex.set(normalisedMessageId, index + windowBaseOffset);
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
  windowBaseOffset = 0;
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  clearMessageColorIndexes();

  messages.forEach((message, index) => {
    if (isRenderableChatMessage(message)) {
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

  // Hold the reference only - the flush slices to MAX_RECENT_MESSAGES, so
  // slicing per deferred sync (~10/s under load) would be redundant.
  pendingRecentMessagesChannelId = currentChannelId;
  pendingRecentMessages = nextMessages;

  if (recentMessagesSyncTimer) {
    return;
  }

  recentMessagesSyncTimer = setTimeout(
    flushPendingRecentMessagesSync,
    RECENT_MESSAGES_SYNC_DELAY_MS,
  );
};

const trimMessageIndexes = (): number => {
  const maxChatMessages = getEffectiveMaxChatMessages();
  const trimCount = messageKeyOrder.length - maxChatMessages;
  if (trimCount <= 0) {
    return 0;
  }

  // One splice instead of shift-per-key - shift moves the whole remaining
  // window each call, which a full window pays per flush.
  const removedKeys = messageKeyOrder.splice(0, trimCount);
  let trimmedCount = 0;
  for (const removedKey of removedKeys) {
    if (removedKey) {
      messageKeySet.delete(removedKey);
      trimmedCount += 1;
    }
  }

  return trimmedCount;
};

type MessageWindowAppendResult = {
  droppedMessages: AnyChatMessageType[];
  nextMessages: AnyChatMessageType[];
};

const appendToMessageWindow = (
  currentMessages: AnyChatMessageType[],
  storedMessages: AnyChatMessageType[],
): MessageWindowAppendResult => {
  const extraMessageCount =
    currentMessages.length +
    storedMessages.length -
    getEffectiveMaxChatMessages();

  if (extraMessageCount <= 0) {
    return {
      droppedMessages: [],
      nextMessages: [...currentMessages, ...storedMessages],
    };
  }

  /**
   * Slice before concatenating - joining first copied the whole window an
   * extra time per flush, ~10x a second on busy channels.
   */
  if (extraMessageCount >= currentMessages.length) {
    const storedDropCount = extraMessageCount - currentMessages.length;
    return {
      droppedMessages: [
        ...currentMessages,
        ...storedMessages.slice(0, storedDropCount),
      ],
      nextMessages: storedMessages.slice(storedDropCount),
    };
  }

  return {
    droppedMessages: currentMessages.slice(0, extraMessageCount),
    nextMessages: [
      ...currentMessages.slice(extraMessageCount),
      ...storedMessages,
    ],
  };
};

const shiftMessageIndexes = (offset: number) => {
  if (offset <= 0) {
    return;
  }

  windowBaseOffset += offset;
};

// Dropping evicted entries and shifting survivors is pure Map work; a full
// rebuild per front-trim re-ran the whole window ~10x/s on busy chats.
const indexAppendedMessages = (
  storedMessages: AnyChatMessageType[],
  appendStartIndex: number,
  droppedMessages: AnyChatMessageType[],
) => {
  droppedMessages.forEach((message, droppedIndex) => {
    const key = getChatMessageKey(message.message_id, message.message_nonce);
    messageKeyToIndex.delete(key);

    const normalisedMessageId = normaliseMessageField(message.message_id);
    // Another window entry can share this message_id under a different
    // nonce; only drop the id entry when it still points at the evicted row.
    if (
      normalisedMessageId &&
      messageIdToIndex.get(normalisedMessageId) ===
        droppedIndex + windowBaseOffset
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
    const key = getChatMessageKey(messageId, messageNonce);
    const storedIndex = messageKeyToIndex.get(key);

    if (storedIndex === undefined) {
      continue;
    }
    const index = storedIndex - windowBaseOffset;

    const currentMessage = nextMessages[index];
    if (!currentMessage) {
      continue;
    }

    if (messageUpdates.message) {
      ensurePartIdsForStore(messageUpdates.message);
    }

    if (nextMessages === currentMessages) {
      nextMessages = currentMessages.slice();
    }

    nextMessages[index] = {
      ...currentMessage,
      ...messageUpdates,
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
  if (!isRenderableChatMessage(message)) {
    return;
  }

  const key = getChatMessageKey(message.message_id, message.message_nonce);
  if (messageKeySet.has(key)) {
    return;
  }

  const storedMessage = prepareMessageForStore(message, key);
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
    // Key order diverged from the window (shouldn't happen) - resync fully.
    rebuildMessageIndexes(nextMessages);
  }

  chatStore$.messages.set(nextMessages);
  // Defer the MMKV persist so a single message never triggers a synchronous
  // full-store write on the hot path; the cache is only a warm-start aid.
  syncRecentMessagesForCurrentChannel(nextMessages, 'defer');
};

export const addMessages = (messages: (AnyChatMessageType | undefined)[]) => {
  if (messages.length === 0) {
    return;
  }
  const storedMessages: AnyChatMessageType[] = [];
  for (const msg of messages) {
    if (!isRenderableChatMessage(msg)) {
      continue;
    }

    const key = getChatMessageKey(msg.message_id, msg.message_nonce);
    if (messageKeySet.has(key)) {
      continue;
    }
    messageKeySet.add(key);
    messageKeyOrder.push(key);
    storedMessages.push(prepareMessageForStore(msg, key));
  }

  if (storedMessages.length === 0) {
    return;
  }
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
    // Key order diverged from the window (shouldn't happen) - resync fully.
    rebuildMessageIndexes(nextMessages);
  }

  chatStore$.messages.set(nextMessages);
  chatPerfMarks.committed(storedMessages.length);
  syncRecentMessagesForCurrentChannel(nextMessages, 'defer');
};

export const moderateMessageById = (
  messageId: string,
  moderationNotice: string,
) => {
  const message = getMessageById(messageId);
  if (!message) {
    return;
  }

  const key = getChatMessageKey(message.message_id, message.message_nonce);
  const storedIndex = messageKeyToIndex.get(key);

  if (storedIndex === undefined) {
    return;
  }
  const index = storedIndex - windowBaseOffset;

  const currentMessages = chatStore$.messages.peek();
  const currentMessage = currentMessages[index];
  if (!currentMessage) {
    return;
  }

  publishMessageAtIndex(
    index,
    {
      ...currentMessage,
      message: [
        {
          type: 'text',
          content: createModeratedMessageText(
            currentMessage.message,
            moderationNotice,
          ),
        },
      ],
      moderationNotice,
    },
    'immediate',
  );
};

export const moderateMessagesByLogin = (
  login: string,
  moderationNotice: string,
) => {
  const target = normaliseChatUsername(login);
  if (!target) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  let didModerateMessages = false;
  const nextMessages = currentMessages.slice();

  for (let index = 0; index < currentMessages.length; index += 1) {
    const message = currentMessages[index];
    if (!isRenderableChatMessage(message)) {
      continue;
    }

    const messageLogin = normaliseChatUsername(
      message.userstate?.login || message.userstate?.username || message.sender,
    );

    if (messageLogin !== target) {
      continue;
    }

    didModerateMessages = true;

    nextMessages[index] = {
      ...message,
      message: [
        {
          type: 'text',
          content: createModeratedMessageText(
            message.message,
            moderationNotice,
          ),
        },
      ],
      moderationNotice,
    };
  }

  if (!didModerateMessages) {
    return;
  }

  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

const forgetMessageKeys = (messages: AnyChatMessageType[]) => {
  messages.forEach(message => {
    const key = getChatMessageKey(message.message_id, message.message_nonce);
    messageKeySet.delete(key);

    const orderIndex = messageKeyOrder.indexOf(key);
    if (orderIndex >= 0) {
      messageKeyOrder.splice(orderIndex, 1);
    }
  });
};

export const removeMessagesByLogin = (login: string) => {
  const target = normaliseChatUsername(login);
  if (!target) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  const removedMessages: AnyChatMessageType[] = [];
  const nextMessages = currentMessages.filter(message => {
    if (!isRenderableChatMessage(message)) {
      return true;
    }

    const messageLogin = normaliseChatUsername(
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

  forgetMessageKeys(removedMessages);

  rebuildMessageIndexes(nextMessages);
  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

export const getMessageById = (
  messageId: string,
): AnyChatMessageType | undefined => {
  const storedIndex = messageIdToIndex.get(normaliseMessageField(messageId));
  if (storedIndex === undefined) {
    return undefined;
  }

  return chatStore$.messages.peek()[storedIndex - windowBaseOffset];
};

export const removeMessageById = (messageId: string) => {
  const normalisedMessageId = normaliseMessageField(messageId);
  if (!normalisedMessageId) {
    return;
  }

  const currentMessages = chatStore$.messages.peek();
  const removedMessages = currentMessages.filter(
    message =>
      isRenderableChatMessage(message) &&
      normaliseMessageField(message.message_id) === normalisedMessageId,
  );

  if (removedMessages.length === 0) {
    return;
  }

  forgetMessageKeys(removedMessages);

  const nextMessages = currentMessages.filter(
    message =>
      !isRenderableChatMessage(message) ||
      normaliseMessageField(message.message_id) !== normalisedMessageId,
  );

  rebuildMessageIndexes(nextMessages);
  chatStore$.messages.set(nextMessages);
  syncRecentMessagesForCurrentChannel(nextMessages);
};

export const clearMessages = () => {
  chatPerfMarks.channelReset();
  flushPendingRecentMessagesSync();
  frontTrimSuspended = false;
  windowBaseOffset = 0;
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
    const key = getChatMessageKey(message.message_id, message.message_nonce);
    messageKeySet.add(key);
    messageKeyOrder.push(key);
  });

  const storedMessages = recentMessages.map(message =>
    prepareMessageForStore({ ...message, isHistorical: true }),
  );
  rebuildMessageIndexes(storedMessages);
  chatStore$.messages.set(storedMessages);

  return recentMessages.length;
};

export const getMessageColor = (messageId: string): string | undefined =>
  getIndexedMessageColor(messageId);

export { getUserMessageColor } from './messageColorIndex';
