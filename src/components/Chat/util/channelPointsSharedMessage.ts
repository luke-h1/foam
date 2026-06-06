import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

const SHARED_CHANNEL_POINTS_PART_TYPES = new Set([
  'emote',
  'stvEmote',
  'mention',
  'twitchClip',
  'mediaLink',
]);

export function hasSharedChannelPointsMessage(message: ParsedPart[]): boolean {
  for (const part of message) {
    if (part.type === 'text' || part.type === 'link') {
      if (part.content.trim().length > 0) {
        return true;
      }
      continue;
    }

    if (SHARED_CHANNEL_POINTS_PART_TYPES.has(part.type)) {
      return true;
    }
  }

  return false;
}
