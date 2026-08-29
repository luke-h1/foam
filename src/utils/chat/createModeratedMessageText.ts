import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

export function createModeratedMessageText(
  message: ParsedPart[],
  moderationNotice: string,
): string {
  const plainText = replaceEmotesWithText(message).trim();
  return plainText ? `${plainText}—${moderationNotice}` : moderationNotice;
}
