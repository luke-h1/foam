import type { SanitisedEmote } from '@app/types/emote';
import { addUrl } from '@app/utils/emote/emoteImageVariants/addUrl';

export function getEmoteImageCacheUrls(emote: SanitisedEmote): string[] {
  const urls = new Set<string>();
  addUrl(urls, emote.url);
  addUrl(urls, emote.static_url);

  return Array.from(urls);
}
