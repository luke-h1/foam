import type { ParsedPart } from '@app/utils/chat/parsed-part';
import { replaceEmotesWithText } from '@app/utils/chat/replace-emotes-with-text';

export function createModeratedMessageText(
  message: ParsedPart[],
  moderationNotice: string,
): string {
  const plainText = replaceEmotesWithText(message).trim();
  return plainText ? `${plainText}—${moderationNotice}` : moderationNotice;
}
