import type { ParsedPart } from '@app/utils/chat/parsedPart';

export type InlineFlowPart = ParsedPart<'text' | 'mention' | 'link' | 'emote'>;

/**
 * True when every part can live inside a single Text element, which lets
 * the body wrap inline after the username (like Twitch web) instead of
 * dropping to a rectangular block on the next flex line.
 */
export function canRenderMessageInline(
  message: ParsedPart[],
  options: { hasPaint: boolean; isModerated: boolean },
): message is InlineFlowPart[] {
  if (options.hasPaint || options.isModerated) {
    return false;
  }

  return message.every(
    part =>
      part.type === 'text' ||
      part.type === 'mention' ||
      part.type === 'link' ||
      // Overlaid zero-width emotes render absolutely positioned, which a
      // single Text element cannot host.
      (part.type === 'emote' && !part.zero_width && !part.overlaid?.length),
  );
}
