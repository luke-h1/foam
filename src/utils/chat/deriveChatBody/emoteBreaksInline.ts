import type { ParsedPart } from '@app/utils/chat/parsedPart';

/**
 * Standalone zero-width emotes and attached overlays both need the
 * flex-wrap renderer; absolute positioning breaks inside a Text.
 */
export function emoteBreaksInline(part: ParsedPart<'emote'>): boolean {
  return Boolean(part.zero_width || part.overlaid?.length);
}
