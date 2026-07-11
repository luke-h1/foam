import { emoteBreaksInline } from '@app/utils/chat/deriveChatBody/emoteBreaksInline';
import { structureCache } from '@app/utils/chat/deriveChatBody/structureCache';
import { MessageStructure } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

export function getMessageStructure(message: ParsedPart[]): MessageStructure {
  const cached = structureCache.get(message);
  if (cached) {
    return cached;
  }

  let canBeInline = true;
  let containsEmotes = false;
  for (const part of message) {
    if (part.type === 'emote') {
      containsEmotes = true;
      if (emoteBreaksInline(part)) {
        canBeInline = false;
      }
    } else if (
      part.type !== 'text' &&
      part.type !== 'mention' &&
      part.type !== 'link'
    ) {
      canBeInline = false;
    }
  }

  const structure: MessageStructure = { canBeInline, containsEmotes };
  structureCache.set(message, structure);
  return structure;
}
