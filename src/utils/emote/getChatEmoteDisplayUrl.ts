import type { EmoteImageScale, EmoteImageVariants } from '@app/types/emote';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

export type ChatDisplayEmote = Partial<{
  image_variants: EmoteImageVariants | null;
  url: string | null;
  static_url: string | null;
}>;

interface ChatEmoteDisplayOptions {
  disableAnimations: boolean;
  /**
   * Chat rows use the 4x default: a message token carries `url` and
   * `static_url` but no variant sets, so 4x is the url a row renders.
   */
  preferredScale?: EmoteImageScale;
}

/**
 * The url a chat surface shows for an emote. Chat rows and the emote warmers
 * both call this, so a warmer warms the url a row renders.
 */
export function getChatEmoteDisplayUrl(
  emote: ChatDisplayEmote,
  { disableAnimations, preferredScale = '4x' }: ChatEmoteDisplayOptions,
): string {
  return getDisplayEmoteUrl({
    image_variants: emote.image_variants,
    url: emote.url,
    static_url: emote.static_url,
    disableAnimations,
    preferredScale,
  });
}
