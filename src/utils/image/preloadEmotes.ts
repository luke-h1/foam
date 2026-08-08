/**
 * Emote preloading utility.
 *
 * Warms emote images into expo-image's disk cache so they resolve without a
 * network hop the first time they appear in chat. This must target the same
 * cache the chat renderer reads — ChatInlineImage renders via expo-image, so
 * preloading goes through ExpoImage.prefetch.
 */
import { Image as ExpoImage } from 'expo-image';

import type { SanitisedEmote } from '@app/types/emote';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants/withResolvedEmoteImageVariants';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolveEmoteDisplayUrl';
import { logger } from '@app/utils/logger';

const preloadedUrls = new Set<string>();
const MAX_PRELOADED_CACHE = 500;

/**
 * `prefetch` resolves false when it skips any url in the batch and rejects when
 * the whole call fails, so both outcomes are reported with the batch's shape
 * rather than the urls themselves.
 */
function describePreloadBatch(batch: string[]) {
  const [firstUrl] = batch;
  const descriptor = firstUrl ? describeEmoteUrl(firstUrl) : null;

  return {
    batchSize: batch.length,
    tags: {
      emoteProvider: descriptor?.provider ?? 'unknown',
      emoteScale: descriptor?.scale ?? null,
      emoteKind: descriptor?.kind ?? null,
    },
  };
}

/**
 * Preload a batch of emotes in the background
 */
export async function preloadEmotes(
  emotes: SanitisedEmote[],
  limit = 50,
): Promise<void> {
  const toPreload: string[] = [];
  const seen = new Set<string>();

  // Keep copy-only variants out of the eager preload path. They remain on the
  // emote metadata for copy actions, but warming every static/animated scale
  // would multiply channel-entry network work. Warm only the display URL
  // that chat rows actually render.
  for (const emote of emotes) {
    if (toPreload.length >= limit) {
      break;
    }

    const url = resolveEmoteDisplayUrl(withResolvedEmoteImageVariants(emote));
    if (!url || seen.has(url) || preloadedUrls.has(url)) {
      continue;
    }

    seen.add(url);
    toPreload.push(url);
  }

  if (toPreload.length === 0) {
    return;
  }

  const BATCH_SIZE = 10;
  const batches: string[][] = [];
  for (let i = 0; i < toPreload.length; i += BATCH_SIZE) {
    batches.push(toPreload.slice(i, i + BATCH_SIZE));
  }
  for (const batch of batches) {
    // Sequential batches to avoid overwhelming the network. Failed URLs stay
    // out of preloadedUrls so a later attempt can retry them.
    try {
      // eslint-disable-next-line react-doctor/async-await-in-loop -- batch preload is intentionally throttled
      const warmed = await ExpoImage.prefetch(batch, 'disk');
      if (warmed) {
        batch.forEach(url => preloadedUrls.add(url));
      } else {
        logger.chat.warn('chat.emote.preload_skipped', {
          name: 'chat_resources_warning',
          ...describePreloadBatch(batch),
        });
      }
    } catch (error) {
      logger.chat.error('chat.emote.preload_failed', {
        name: 'chat_resources_error',
        error,
        ...describePreloadBatch(batch),
      });
    }
  }

  if (preloadedUrls.size > MAX_PRELOADED_CACHE) {
    const urls = Array.from(preloadedUrls);
    const toRemove = urls.slice(0, preloadedUrls.size - MAX_PRELOADED_CACHE);
    toRemove.forEach(url => preloadedUrls.delete(url));
  }
}

/**
 * Preload global emotes (call once per session)
 * These are shown across all channels so preloading them improves UX everywhere
 */
export async function preloadGlobalEmotes(emoteData: {
  twitchGlobalEmotes?: SanitisedEmote[];
  sevenTvGlobalEmotes?: SanitisedEmote[];
  bttvGlobalEmotes?: SanitisedEmote[];
  ffzGlobalEmotes?: SanitisedEmote[];
}): Promise<void> {
  const allGlobal = [
    ...(emoteData.twitchGlobalEmotes || []),
    ...(emoteData.sevenTvGlobalEmotes || []),
    ...(emoteData.bttvGlobalEmotes || []),
    ...(emoteData.ffzGlobalEmotes || []),
  ];

  // Kept in step with the shared-ref warm limits (useCachedEmotes) so channel
  // entry doesn't fire two large, overlapping decode storms that together
  // starve on-screen animated emotes. The long tail warms on-demand instead.
  await preloadEmotes(allGlobal, 64);
}

/**
 * Preload channel-specific emotes when entering a channel
 */
export async function preloadChannelEmotes(emoteData: {
  twitchChannelEmotes?: SanitisedEmote[];
  sevenTvChannelEmotes?: SanitisedEmote[];
  bttvChannelEmotes?: SanitisedEmote[];
  ffzChannelEmotes?: SanitisedEmote[];
}): Promise<void> {
  const allChannel = [
    ...(emoteData.sevenTvChannelEmotes || []), // 7TV first (most common in Twitch chat)
    ...(emoteData.bttvChannelEmotes || []),
    ...(emoteData.ffzChannelEmotes || []),
    ...(emoteData.twitchChannelEmotes || []),
  ];

  // Trimmed alongside the shared-ref warm limits to shrink the channel-entry
  // decode storm that starves on-screen animated emotes (see useCachedEmotes).
  await preloadEmotes(allChannel, 32);
}

/**
 * Clear preload cache (call on memory pressure or channel change)
 */
export function clearPreloadCache(): void {
  preloadedUrls.clear();
}
