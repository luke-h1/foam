import type { MessageToken } from '@app/utils/chat/message-token';

const SHARED_CHANNEL_POINTS_PART_TYPES = new Set([
  'emote',
  'stvEmoteLink',
  'mention',
  'twitchClip',
  'mediaLink',
]);

export function hasSharedChannelPointsMessage(
  message: MessageToken[],
): boolean {
  for (const token of message) {
    const isTextual = token.type === 'text' || token.type === 'link';

    if (isTextual && token.content.trim().length > 0) {
      return true;
    }

    if (!isTextual && SHARED_CHANNEL_POINTS_PART_TYPES.has(token.type)) {
      return true;
    }
  }

  return false;
}
