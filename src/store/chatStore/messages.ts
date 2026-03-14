import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { batch } from '@legendapp/state';

import type { Bit, ChatMessageType, ChatUser } from './constants';
import { chatStore$ } from './state';

const messageKeySet = new Set<string>();
const messageColorIndex = new Map<string, string>();

const getMessageKey = (messageId: string, messageNonce: string): string =>
  `${messageId}_${messageNonce}`;

export const addMessage = <TNoticeType extends NoticeVariants>(
  message: ChatMessageType<TNoticeType>,
) => {
  const current = chatStore$.messages.peek();
  chatStore$.messages.set([...current, message as ChatMessageType<never>]);
};

export const addMessages = (messages: ChatMessageType<never>[]) => {
  if (messages.length === 0) return;
  const newMessages = messages.filter(msg => {
    const key = getMessageKey(msg.message_id, msg.message_nonce);
    if (messageKeySet.has(key)) {
      return false;
    }
    messageKeySet.add(key);
    return true;
  });

  if (newMessages.length === 0) {
    return;
  }
  newMessages.forEach(msg => {
    if (msg.userstate?.color && msg.message_id) {
      messageColorIndex.set(msg.message_id, msg.userstate.color);
    }
  });
  batch(() => {
    const current = chatStore$.messages.peek();
    chatStore$.messages.set([...current, ...newMessages]);
  });
};

export const updateMessage = (
  messageId: string,
  messageNonce: string,
  updates: Partial<Pick<ChatMessageType<never>, 'message' | 'badges'>>,
) => {
  const messages = chatStore$.messages.peek();
  const index = messages.findIndex(
    m => m.message_id === messageId && m.message_nonce === messageNonce,
  );

  if (index >= 0) {
    const msg$ = chatStore$.messages[index];
    if (msg$) {
      msg$.set(prev => ({ ...prev, ...updates }));
    }
  }
};

export const clearMessages = () => {
  messageKeySet.clear();
  messageColorIndex.clear();
  chatStore$.messages.set([]);
};

export const getMessageColor = (messageId: string): string | undefined =>
  messageColorIndex.get(messageId);

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
