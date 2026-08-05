import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

/**
 * Body text for a message a moderator deleted or timed out: the original text
 * with the notice appended, or the notice alone when nothing survives the
 * emote-to-text pass. Both the pre-commit buffer and the store rewrite
 * moderated messages, so they share the wording from here.
 */
export function createModeratedMessageText(
  message: ParsedPart[],
  moderationNotice: string,
): string {
  const plainText = replaceEmotesWithText(message).trim();
  return plainText ? `${plainText}—${moderationNotice}` : moderationNotice;
}
