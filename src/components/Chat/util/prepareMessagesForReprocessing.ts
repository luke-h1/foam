import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { AnyChatMessageType } from './messageHandlers';

export function isUserChatProcessableMessage(msg: AnyChatMessageType): boolean {
  if (msg.sender === 'System') {
    return false;
  }

  if (
    'notice_tags' in msg &&
    msg.notice_tags &&
    !msg.isAnnouncement &&
    !msg.isHighlightedMessage
  ) {
    return false;
  }

  return true;
}

export function shouldReprocessMessage(msg: AnyChatMessageType): boolean {
  return isUserChatProcessableMessage(msg);
}

export function extractTextFromMessage(message: ParsedPart[]): string {
  return replaceEmotesWithText(message);
}

export function filterMessagesForReprocessing(
  messages: AnyChatMessageType[],
): AnyChatMessageType[] {
  return messages.filter(shouldReprocessMessage);
}
