import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { logger } from '@app/utils/logger';

import { AnyChatMessageType } from './messageHandlers';
import {
  extractTextFromMessage,
  filterMessagesForReprocessing,
} from './prepareMessagesForReprocessing';

export interface MessageToReprocess {
  message: ParsedPart[];
  userstate: AnyChatMessageType['userstate'];
  sender: string;
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
  ) => void | Promise<void>,
): void {
  if (messages.length === 0) {
    return;
  }

  logger.chat.info('🔄 Reprocessing all messages with new emote data');

  const messagesToReprocess = filterMessagesForReprocessing(messages);

  messagesToReprocess.forEach(msg => {
    const textContent = extractTextFromMessage(msg.message);

    if (textContent.trim()) {
      void processMessageEmotes(textContent, msg.userstate, msg);
    }
  });
}
