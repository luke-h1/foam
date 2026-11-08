import type { SanitisedEmote } from '@app/types/emote';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emote-image-variants/withResolvedEmoteImageVariants';
import { getChatEmoteDisplayUrl } from '@app/utils/emote/getChatEmoteDisplayUrl';
import { EMOTE_PICKER_SCALE } from '@app/utils/emote/resolveEmoteScale';

const animatedUrlCache = new WeakMap<SanitisedEmote, string>();
const staticUrlCache = new WeakMap<SanitisedEmote, string>();

/**
 * Display URL for an emote in the picker grid (2x; see #594).
 */
export function getEmotePickerDisplayUrl(
  emote: SanitisedEmote,
  disableAnimations: boolean,
): string {
  const cache = disableAnimations ? staticUrlCache : animatedUrlCache;
  const cached = cache.get(emote);

  if (cached !== undefined) {
    return cached;
  }

  const url =
    getChatEmoteDisplayUrl(withResolvedEmoteImageVariants(emote), {
      disableAnimations,
      preferredScale: EMOTE_PICKER_SCALE,
    }) || emote.url;

  cache.set(emote, url);
  return url;
}
