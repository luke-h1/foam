import type { ParsedPart } from '@app/utils/chat/parsed-part';

const SHARED_CHANNEL_POINTS_PART_TYPES = new Set([
  'emote',
  'stvEmote',
  'mention',
  'twitchClip',
  'mediaLink',
]);

export function hasSharedChannelPointsMessage(message: ParsedPart[]): boolean {
  for (const part of message) {
    const isTextual = part.type === 'text' || part.type === 'link';

    if (isTextual && part.content.trim().length > 0) {
      return true;
    }

    if (!isTextual && SHARED_CHANNEL_POINTS_PART_TYPES.has(part.type)) {
      return true;
    }
  }

  return false;
}
