import type { SanitisedEmote } from '@app/types/emote';
import { deriveEmoteImageVariantsFromUrl } from '@app/utils/emote/emoteImageVariants/deriveEmoteImageVariantsFromUrl';
import { pickEmoteVariantUrl } from '@app/utils/emote/emoteImageVariants/pickEmoteVariantUrl';

const resolvedVariantCache = new WeakMap<SanitisedEmote, SanitisedEmote>();

export function withResolvedEmoteImageVariants<T extends SanitisedEmote>(
  emote: T,
): T {
  if (emote.image_variants?.animated || emote.image_variants?.static) {
    return emote;
  }

  const cached = resolvedVariantCache.get(emote);
  if (cached) {
    // SAFETY: the cache entry is the spread copy of this same emote, so it carries T's shape.
    return cached as T;
  }

  const imageVariants = deriveEmoteImageVariantsFromUrl(emote.url);
  if (!imageVariants) {
    return emote;
  }

  const staticUrl =
    emote.static_url ??
    pickEmoteVariantUrl({
      fallbackUrl: emote.url,
      imageVariants,
      preferredKind: 'static',
    });

  const resolvedEmote = {
    ...emote,
    static_url: staticUrl,
    image_variants: imageVariants,
  };
  resolvedVariantCache.set(emote, resolvedEmote);
  return resolvedEmote;
}
