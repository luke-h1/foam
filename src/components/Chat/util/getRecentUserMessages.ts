import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

const MAX_RECENT_USER_MESSAGES = 5;

export interface RecentUserMessage {
  key: string;
  text: string;
  timestamp?: string;
}

function normaliseLogin(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

/**
 * peek() on open: the scrollback updates constantly and re-rendering the
 * user sheet per message would defeat the chat flush batching.
 */
export function getRecentUserMessages(
  login?: string,
  username?: string,
): RecentUserMessage[] {
  const target = normaliseLogin(login) || normaliseLogin(username);
  if (!target) {
    return [];
  }

  const messages = chatStore$.messages.peek();
  const recentMessages: RecentUserMessage[] = [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) {
      continue;
    }

    const messageLogin = normaliseLogin(
      message.userstate?.login || message.userstate?.username || message.sender,
    );
    if (messageLogin !== target) {
      continue;
    }

    const text = replaceEmotesWithText(message.message).trim();
    if (!text) {
      continue;
    }

    recentMessages.push({
      key: message.id ?? `${message.message_id}_${message.message_nonce}`,
      text,
      timestamp: message.timestamp,
    });

    if (recentMessages.length >= MAX_RECENT_USER_MESSAGES) {
      break;
    }
  }

  return recentMessages.reverse();
}
