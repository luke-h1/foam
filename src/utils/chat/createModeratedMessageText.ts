import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

/**
 * Both the pre-commit buffer and the store rewrite moderated messages, so
 * they share the wording from here.
 */
export function createModeratedMessageText(
  message: ParsedPart[],
  moderationNotice: string,
): string {
  const plainText = replaceEmotesWithText(message).trim();
  return plainText ? `${plainText}—${moderationNotice}` : moderationNotice;
}
