import type { CustomHighlight } from '@app/store/preferenceStore';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

// Match results are cached per message-part array; the rules array is part of
// the cache entry so edits to the rules invalidate stale hits without a
// revision counter.
const matchCache = new WeakMap<
  ParsedPart[],
  { rules: CustomHighlight[]; match: CustomHighlight | undefined }
>();

const messageTextCache = new WeakMap<ParsedPart[], string>();

function getMessageText(message: ParsedPart[]): string {
  const cached = messageTextCache.get(message);
  if (cached !== undefined) {
    return cached;
  }

  const text = replaceEmotesWithText(message).toLowerCase();
  messageTextCache.set(message, text);
  return text;
}

export function normaliseHighlightPhrase(phrase: string): string {
  return phrase.trim().toLowerCase();
}

export function findCustomHighlight(
  message: ParsedPart[],
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
