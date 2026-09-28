import type { CustomHighlight } from '@app/store/preference-store';
import type { MessageToken } from '@app/utils/chat/message-token';
import { replaceEmotesWithText } from '@app/utils/chat/replace-emotes-with-text';

// Match results are cached per message-token array; the rules array is token of
// the cache entry so edits to the rules invalidate stale hits without a
// revision counter.
const matchCache = new WeakMap<
  MessageToken[],
  { rules: CustomHighlight[]; match: CustomHighlight | undefined }
>();

const messageTextCache = new WeakMap<MessageToken[], string>();

function getMessageText(message: MessageToken[]): string {
  const cached = messageTextCache.get(message);

  if (cached !== undefined) {
    return cached;
  }

  const text = replaceEmotesWithText(message).toLowerCase();
  messageTextCache.set(message, text);
  return text;
}

export function findCustomHighlight(
  message: MessageToken[],
  rules: CustomHighlight[],
): CustomHighlight | undefined {
  if (rules.length === 0 || message.length === 0) {
    return undefined;
  }

  const cached = matchCache.get(message);

  if (cached && cached.rules === rules) {
    return cached.match;
  }

  const text = getMessageText(message);
  const match = rules.find(rule => rule.phrase && text.includes(rule.phrase));
  matchCache.set(message, { rules, match });

  return match;
}
