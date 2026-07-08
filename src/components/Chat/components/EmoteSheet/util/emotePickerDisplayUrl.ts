import type { SanitisedEmote } from '@app/types/emote';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { EMOTE_PICKER_SCALE } from '@app/utils/emote/resolveEmoteScale';

const displayUrlCache = new WeakMap<SanitisedEmote, string>();

/**
 * Display URL for an emote in the picker grid (2x; see #594).
 */
export function getEmotePickerDisplayUrl(emote: SanitisedEmote): string {
  const cached = displayUrlCache.get(emote);
  if (cached !== undefined) {
    return cached;
  }

  const resolved = withResolvedEmoteImageVariants(emote);
  const url =
    getDisplayEmoteUrl({
      image_variants: resolved.image_variants,
      url: resolved.url,
      static_url: resolved.static_url,
      preferredScale: EMOTE_PICKER_SCALE,
    }) || emote.url;

  displayUrlCache.set(emote, url);
  return url;
}
