import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { batch } from '@legendapp/state';

import type { Bit, ChatMessageType, ChatUser } from './constants';
import { chatStore$ } from './state';

const messageKeySet = new Set<string>();
const messageKeyOrder: string[] = [];
const messageIdToIndex = new Map<string, number>();
const messageKeyToIndex = new Map<string, number>();
const messageColorIndex = new Map<string, string>();
const senderColorIndex = new Map<string, string>();
const MAX_CHAT_MESSAGES = 600;
const MAX_RECENT_MESSAGES = 80;
const MAX_RECENT_MESSAGE_CHANNELS = 10;
const RECENT_MESSAGES_SYNC_DELAY_MS = 1000;

let recentMessagesSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRecentMessagesChannelId: string | null = null;
let pendingRecentMessages: ChatMessageType<never>[] | null = null;

const getMessageKey = (messageId: string, messageNonce: string): string =>
  `${messageId}_${messageNonce}`;

const normaliseIndexKey = (value: string | undefined): string | null => {
  const normalised = value?.trim().toLowerCase();
  return normalised ? normalised : null;
};

const indexMessage = (message: ChatMessageType<never>, index: number) => {
  const key = getMessageKey(message.message_id, message.message_nonce);
  messageKeyToIndex.set(key, index);

  if (message.message_id) {
    messageIdToIndex.set(message.message_id, index);
  }

  if (message.userstate?.color && message.message_id) {
    messageColorIndex.set(message.message_id, message.userstate.color);
  }

  const color = message.userstate?.color;
  if (!color) {
    return;
  }

  const senderKeys = [
    normaliseIndexKey(message.sender),
    normaliseIndexKey(message.userstate?.username),
    normaliseIndexKey(message.userstate?.login),
  ];

  senderKeys.forEach(senderKey => {
    if (senderKey) {
      senderColorIndex.set(senderKey, color);
    }
  });
};

const rebuildMessageIndexes = () => {
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  messageColorIndex.clear();
  senderColorIndex.clear();

  const messages = chatStore$.messages.peek();

  messages.forEach((message, index) => {
    indexMessage(message, index);
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
  nextMessages: ChatMessageType<never>[],
) => {
  const recentMessagesByChannel =
    chatStore$.persisted.recentMessagesByChannel.peek() ?? {};
  const existingMessages = recentMessagesByChannel[channelId];
  if (existingMessages === nextMessages) {
    return;
  }

  const nextRecentMessages = nextMessages.slice(-MAX_RECENT_MESSAGES);
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
  nextMessages: ChatMessageType<never>[],
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

export const addMessage = <TNoticeType extends NoticeVariants>(
  message: ChatMessageType<TNoticeType>,
) => {
  const key = getMessageKey(message.message_id, message.message_nonce);
  if (messageKeySet.has(key)) {
    return;
  }

  messageKeySet.add(key);
  messageKeyOrder.push(key);
  const currentMessages = chatStore$.messages.peek();
  const nextMessageIndex = currentMessages.length;
  const nextMessages = [...currentMessages, message as ChatMessageType<never>];
  const messageCount = nextMessages.length;
  let didTrimMessages = false;
  if (messageCount > MAX_CHAT_MESSAGES) {
    didTrimMessages = true;
    chatStore$.messages.set(
      nextMessages.slice(messageCount - MAX_CHAT_MESSAGES),
    );
  } else {
    chatStore$.messages.set(nextMessages);
    indexMessage(message as ChatMessageType<never>, nextMessageIndex);
  }
  syncRecentMessagesForCurrentChannel(chatStore$.messages.peek());
  if (trimMessageIndexes() || didTrimMessages) {
    rebuildMessageIndexes();
  }
};

export const addMessages = (messages: ChatMessageType<never>[]) => {
  if (messages.length === 0) {
    return;
  }
  const newMessages = messages.filter(msg => {
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

  batch(() => {
    const currentMessages = chatStore$.messages.peek();
    const nextMessageStartIndex = currentMessages.length;
    const nextMessages = [...currentMessages, ...newMessages];
    const messageCount = nextMessages.length;
    let didTrimMessages = false;
    if (messageCount > MAX_CHAT_MESSAGES) {
      didTrimMessages = true;
      chatStore$.messages.set(
        nextMessages.slice(messageCount - MAX_CHAT_MESSAGES),
      );
    } else {
      chatStore$.messages.set(nextMessages);
      newMessages.forEach((message, index) => {
        indexMessage(message, nextMessageStartIndex + index);
      });
    }

    syncRecentMessagesForCurrentChannel(chatStore$.messages.peek(), 'defer');
    if (trimMessageIndexes() || didTrimMessages) {
      rebuildMessageIndexes();
    }
  });
};

export const updateMessage = (
  messageId: string,
  messageNonce: string,
  updates: Partial<
    Pick<ChatMessageType<never>, 'message' | 'badges' | 'moderationNotice'>
  >,
) => {
  const key = getMessageKey(messageId, messageNonce);
  const index = messageKeyToIndex.get(key);

  if (typeof index === 'number') {
    const msg$ = chatStore$.messages[index];
    if (msg$) {
      msg$.set(prev => ({ ...prev, ...updates }));
      syncRecentMessagesForCurrentChannel(chatStore$.messages.peek());
    }
  }
};

function normaliseLogin(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function createModeratedText(
  message: ChatMessageType<never>,
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

  const msg$ = chatStore$.messages[index];
  if (!msg$) {
    return;
  }

  msg$.set(prev => ({
    ...prev,
    message: [
      {
        type: 'text',
        content: createModeratedText(prev, moderationNotice),
      },
    ],
    moderationNotice,
  }));
  syncRecentMessagesForCurrentChannel(chatStore$.messages.peek());
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

  currentMessages.forEach((message, index) => {
    const messageLogin = normaliseLogin(
      message.userstate?.login || message.userstate?.username || message.sender,
    );

    if (messageLogin !== target) {
      return;
    }

    const msg$ = chatStore$.messages[index];
    if (!msg$) {
      return;
    }

    msg$.set(prev => ({
      ...prev,
      message: [
        {
          type: 'text',
          content: createModeratedText(prev, moderationNotice),
        },
      ],
      moderationNotice,
    }));
  });

  syncRecentMessagesForCurrentChannel(chatStore$.messages.peek());
};

export const getMessageById = (
  messageId: string,
): ChatMessageType<never> | undefined => {
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
    message => message.message_id === messageId,
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

  chatStore$.messages.set(
    currentMessages.filter(message => message.message_id !== messageId),
  );

  syncRecentMessagesForCurrentChannel(chatStore$.messages.peek());
  rebuildMessageIndexes();
};

export const clearMessages = () => {
  flushPendingRecentMessagesSync();
  messageKeySet.clear();
  messageKeyOrder.length = 0;
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  messageColorIndex.clear();
  chatStore$.messages.set([]);
};

export const restoreRecentMessagesForChannel = (channelId: string): number => {
  const recentMessages =
    chatStore$.persisted.recentMessagesByChannel[channelId]?.peek() ?? [];

  if (recentMessages.length === 0) {
    clearMessages();
    return 0;
  }

  messageKeySet.clear();
  messageKeyOrder.length = 0;
  messageIdToIndex.clear();
  messageKeyToIndex.clear();
  messageColorIndex.clear();
  senderColorIndex.clear();

  recentMessages.forEach(message => {
    const key = getMessageKey(message.message_id, message.message_nonce);
    messageKeySet.add(key);
    messageKeyOrder.push(key);
  });

  chatStore$.messages.set(recentMessages);
  rebuildMessageIndexes();

  return recentMessages.length;
};

export const getMessageColor = (messageId: string): string | undefined =>
  messageColorIndex.get(messageId);

export const getUserMessageColor = (username: string): string | undefined => {
  const key = normaliseIndexKey(username);
  return key ? senderColorIndex.get(key) : undefined;
};

export const addTtvUser = (user: ChatUser) => {
  const existingUsers = chatStore$.ttvUsers.peek();
  if (!existingUsers.some(u => u.userId === user.userId)) {
    chatStore$.ttvUsers.push(user);
  }
};

export const clearTtvUsers = () => {
  chatStore$.ttvUsers.set([]);
};

export const setBits = (bits: Bit[]) => {
  chatStore$.bits.set(bits);
};
