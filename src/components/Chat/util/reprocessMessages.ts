import { ParsedPart } from '@app/utils/chat/parsedPart';
import { logger } from '@app/utils/logger';

import { AnyChatMessageType } from './messageHandlers';
import { extractTextFromMessage } from './prepareMessagesForReprocessing/extractTextFromMessage';
import { filterMessagesForReprocessing } from './prepareMessagesForReprocessing/filterMessagesForReprocessing';

export interface MessageToReprocess {
  message: ParsedPart[];
  userstate: AnyChatMessageType['userstate'];
  sender: string;
}

/**
 * Reprocess all messages with current emote data.
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
