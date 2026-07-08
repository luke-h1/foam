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
      // eslint-disable-next-line react-doctor/async-await-in-loop -- batches are intentionally sequential to avoid a network flood
      await ExpoImage.prefetch(batch, 'memory-disk');
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
