import { scanChatBody } from '@app/utils/chat/deriveChatBody/scanChatBody';
import type { MessageStructure } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

/**
 * Narrowed view of the cached body scan, cached in turn so a hot render path
 * calling this per row allocates nothing and can compare by reference.
 */
const structureCache = new WeakMap<ParsedPart[], MessageStructure>();

export function getMessageStructure(message: ParsedPart[]): MessageStructure {
  const cached = structureCache.get(message);
  if (cached) {
    return cached;
  }

  const { canBeInline, containsEmotes } = scanChatBody(message);
  const structure: MessageStructure = { canBeInline, containsEmotes };
  structureCache.set(message, structure);
  return structure;
}
