import type { EmoteImageVariants } from '@app/types/emote';
import { parseEmoteCdnUrl } from '@app/utils/emote/cdn/emoteCdnRegistry';

export function deriveEmoteImageVariantsFromUrl(
  url?: string | null,
): EmoteImageVariants | null {
  const parsed = url ? parseEmoteCdnUrl(url) : null;

  if (!parsed) {
    return null;
  }

  return parsed.cdn.buildVariants({
    id: parsed.id,
    animated: parsed.kind === 'animated' ? true : null,
    ext: parsed.ext ?? undefined,
  });
}
