/* eslint-disable camelcase */
import { getPreferences } from '@app/store/preference-store';
import type { EmoteImageScale, EmoteImageVariants } from '@app/types/emote';
import { getDisplayEmoteUrl } from '@app/utils/emote/get-display-emote-url';
import { CHAT_INLINE_EMOTE_SCALE } from '@app/utils/emote/resolve-emote-scale';

export interface ResolvableDisplayEmote {
  image_variants?: EmoteImageVariants | null | undefined;
  url?: string | null | undefined;
  static_url?: string | null | undefined;
}

export function resolveEmoteDisplayUrl(
  emote: ResolvableDisplayEmote,
  {
    disableAnimations = getPreferences().disableEmoteAnimations,
    preferredScale = CHAT_INLINE_EMOTE_SCALE,
  }: {
    disableAnimations?: boolean | undefined;
    preferredScale?: EmoteImageScale | undefined;
  } = {},
): string {
  return getDisplayEmoteUrl({
    image_variants: emote.image_variants,
    url: emote.url,
    static_url: emote.static_url,
    disableAnimations,
    preferredScale,
  });
}
