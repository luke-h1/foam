import type { AnyChatMessageType } from '@app/store/chat/types/constants';

import { shouldReprocessMessage } from './shouldReprocessMessage';

export function filterMessagesForReprocessing(
  messages: AnyChatMessageType[],
): AnyChatMessageType[] {
  return messages.filter(shouldReprocessMessage);
}
