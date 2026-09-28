import { scanChatBody } from '@app/utils/chat/derive-chat-body/scan-chat-body';
import type { MessageStructure } from '@app/utils/chat/derive-chat-body/types';
import type { MessageToken } from '@app/utils/chat/message-token';

/**
 * Narrowed view of the cached body scan, cached in turn so a hot render path
 * calling this per row allocates nothing and can compare by reference.
 */
const structureCache = new WeakMap<MessageToken[], MessageStructure>();

export function getMessageStructure(message: MessageToken[]): MessageStructure {
  const cached = structureCache.get(message);

  if (cached) {
    return cached;
  }

  const { fitsInOneText, containsEmotes } = scanChatBody(message);
  const structure: MessageStructure = { fitsInOneText, containsEmotes };
  structureCache.set(message, structure);
  return structure;
}
