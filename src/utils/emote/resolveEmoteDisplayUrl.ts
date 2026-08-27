/* eslint-disable camelcase */
import { getPreferences } from '@app/store/preferences/state';
import type { EmoteImageScale, EmoteImageVariants } from '@app/types/emote';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { CHAT_INLINE_EMOTE_SCALE } from '@app/utils/emote/resolveEmoteScale';

export interface ResolvableDisplayEmote {
  image_variants?: EmoteImageVariants | null;
  url?: string | null;
  static_url?: string | null;
}

/**
 * Owns which url an emote displays at: warm, prefetch, render and the action
 * sheet all resolve here so they cannot disagree on scale or animation variant.
 */
export function resolveEmoteDisplayUrl(
  emote: ResolvableDisplayEmote,
  {
    disableAnimations = getPreferences().disableEmoteAnimations,
    preferredScale = CHAT_INLINE_EMOTE_SCALE,
  }: {
    disableAnimations?: boolean;
    preferredScale?: EmoteImageScale;
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
