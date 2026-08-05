import { Image as ExpoImage } from 'expo-image';

import type { SanitisedEmote } from '@app/types/emote';

import { getEmotePickerDisplayUrl } from './emotePickerDisplayUrl';

const prefetched = new Set<string>();
const MAX_TRACKED = 1500;
const BATCH_SIZE = 4;

export async function prefetchEmotePickerImages(
  emotes: SanitisedEmote[],
  signal?: AbortSignal,
): Promise<void> {
  if (emotes.length === 0 || signal?.aborted) {
    return;
  }

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const emote of emotes) {
    const url = getEmotePickerDisplayUrl(emote);
    if (
      !url ||
      url.startsWith('data:') ||
      url.startsWith('file://') ||
      seen.has(url) ||
      prefetched.has(url)
    ) {
      continue;
    }
    seen.add(url);
    urls.push(url);
  }

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    if (signal?.aborted) {
      return;
    }
    const batch = urls.slice(i, i + BATCH_SIZE);
    try {
      // Disk, never memory. `prefetch` builds a bare SDWebImage context: it sets
      // neither `animatedImageClass` nor the `useAppleWebpCodec` decode option
      // the picker's own <Image> passes, so an animated WebP decodes through
      // ImageIO into a plain multi-frame UIImage. With 'memory-disk' that image
      // is stored under the url key and the cell then reads it back instead of
      // decoding its own, so UIImageView drives it as a CAKeyframeAnimation and
      // CoreAnimation decodes every frame on the main thread at commit
      // (FOAM-TV-MOBILE-W). Warming only the disk cache leaves the cell to
      // decode an SDAnimatedImage off-thread.
      // eslint-disable-next-line react-doctor/async-await-in-loop -- batches are intentionally sequential to avoid a network flood
      await ExpoImage.prefetch(batch, 'disk');
      batch.forEach(url => prefetched.add(url));
    } catch {
      // retry on a later warmup pass
    }
  }

  if (prefetched.size > MAX_TRACKED) {
    const excess = Array.from(prefetched).slice(
      0,
      prefetched.size - MAX_TRACKED,
    );
    excess.forEach(url => prefetched.delete(url));
  }
}
