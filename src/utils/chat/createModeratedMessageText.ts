import type { MessageToken } from '@app/utils/chat/messageToken';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

export function createModeratedMessageText(
  message: MessageToken[],
  moderationNotice: string,
): string {
  const plainText = replaceEmotesWithText(message).trim();
  return plainText ? `${plainText}—${moderationNotice}` : moderationNotice;
}
