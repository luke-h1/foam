import type { SanitisedEmote } from '@app/types/emote';
import { addUrl } from '@app/utils/emote/emoteImageVariants/addUrl';
import { getEmoteImageCacheUrls } from '@app/utils/emote/emoteImageVariants/getEmoteImageCacheUrls';

export function getEmoteImageVariantUrls(emote: SanitisedEmote): string[] {
  const urls = new Set(getEmoteImageCacheUrls(emote));

  Object.values(emote.image_variants?.animated ?? {}).forEach(url => {
    addUrl(urls, url);
  });
  Object.values(emote.image_variants?.static ?? {}).forEach(url => {
    addUrl(urls, url);
  });

  return Array.from(urls);
}
