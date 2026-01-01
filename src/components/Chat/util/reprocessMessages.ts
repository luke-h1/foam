import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { logger } from '@app/utils/logger';
import { AnyChatMessageType } from './messageHandlers';

export interface MessageToReprocess {
  message: ParsedPart[];
  userstate: AnyChatMessageType['userstate'];
  sender: string;
}

/**
 * Determines if a message should be reprocessed for emotes
 * Skips system messages and notice messages
 */
export function shouldReprocessMessage(msg: AnyChatMessageType): boolean {
  // Skip system messages
  if (msg.sender === 'System') {
    return false;
  }

  // Skip notice messages (they have notice_tags)
  if ('notice_tags' in msg && msg.notice_tags) {
    return false;
  }

  return true;
}

/**
 * Extracts text content from a processed message
 * Uses replaceEmotesWithText to convert emotes back to their text representation
 */
export function extractTextFromMessage(message: ParsedPart[]): string {
  return replaceEmotesWithText(message);
}

/**
 * Filters messages that should be reprocessed
 * Returns only messages that are not system messages or notices
 */
export function filterMessagesForReprocessing(
  messages: AnyChatMessageType[],
): AnyChatMessageType[] {
  return messages.filter(shouldReprocessMessage);
}

/**
 * Reprocess all messages with current emote data
 * This is the core logic extracted for testability
 *
 * @param messages - Array of chat messages to reprocess
 * @param processMessageEmotes - Callback to process a message's emotes
 */
export function reprocessMessages(
  messages: AnyChatMessageType[],
  processMessageEmotes: (
    text: string,
    userstate: AnyChatMessageType['userstate'],
    baseMessage: AnyChatMessageType,
  ) => void,
): void {
  if (messages.length === 0) {
    return;
  }

  logger.chat.info('🔄 Reprocessing all messages with new emote data');

  const messagesToReprocess = filterMessagesForReprocessing(messages);

  messagesToReprocess.forEach(msg => {
    const textContent = extractTextFromMessage(msg.message);

    if (textContent.trim()) {
      processMessageEmotes(textContent, msg.userstate, msg);
    }
  });
}
