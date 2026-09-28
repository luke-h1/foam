import type { MessageToken } from '@app/utils/chat/message-token';
import { replaceEmotesWithText } from '@app/utils/chat/replace-emotes-with-text';

export function createModeratedMessageText(
  message: MessageToken[],
  moderationNotice: string,
): string {
  const plainText = replaceEmotesWithText(message).trim();
  return plainText ? `${plainText}—${moderationNotice}` : moderationNotice;
}
