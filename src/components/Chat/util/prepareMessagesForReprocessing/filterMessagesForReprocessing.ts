import { AnyChatMessageType } from '../messageHandlers';
import { shouldReprocessMessage } from './shouldReprocessMessage';

export function filterMessagesForReprocessing(
  messages: AnyChatMessageType[],
): AnyChatMessageType[] {
  return messages.filter(shouldReprocessMessage);
}
