import type { MessageToken } from '@app/utils/chat/message-token';

/**
 * Standalone zero-width emotes and attached overlays both need the
 * flex-wrap renderer; absolute positioning breaks inside a Text.
 */
export function emoteBreaksInline(token: MessageToken<'emote'>): boolean {
  return Boolean(token.zero_width || token.overlaid?.length);
}
