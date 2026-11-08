import type { EmoteImageScale, EmoteImageVariants } from '@app/types/emote';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

export type ChatDisplayEmote = Partial<{
  image_variants: EmoteImageVariants | null;
  url: string | null;
  static_url: string | null;
}>;

interface ChatEmoteDisplayOptions {
  disableAnimations: boolean;
  preferredScale?: EmoteImageScale;
}

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
