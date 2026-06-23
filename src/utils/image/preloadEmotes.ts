/**
 * Emote preloading utility.
 *
 * Warms emote images into expo-image's memory + disk cache so they render
 * instantly (already decoded) the first time they appear in chat. This must
 * target the same cache the chat renderer reads — ChatInlineImage renders via
 * expo-image, so preloading goes through ExpoImage.prefetch.
 */
import { Image as ExpoImage } from 'expo-image';

import { getPreferences } from '@app/store/preferenceStore';
import type { SanitisedEmote } from '@app/types/emote';
import { isLowEndDevice } from '@app/utils/device/deviceTier';
import { withResolvedEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import {
  isSevenTvEmoteSite,
  resolveEmotePreferredScale,
} from '@app/utils/emote/resolveEmoteScale';

// Track preloaded URLs to avoid duplicate preloads
const preloadedUrls = new Set<string>();
const MAX_PRELOADED_CACHE = 500;

function getDisplayEmoteCacheUrls(emote: SanitisedEmote): string[] {
  const resolved = withResolvedEmoteImageVariants(emote);
  const preferredScale = resolveEmotePreferredScale({
    isSevenTv: isSevenTvEmoteSite(emote.site),
    sevenTvLowRes: getPreferences().sevenTvLowResEmotes,
    isLowEnd: isLowEndDevice(),
  });
  const urls = new Set<string>();

  for (const disableAnimations of [false, true]) {
    const url = getDisplayEmoteUrl({
      image_variants: resolved.image_variants,
      url: resolved.url,
      static_url: resolved.static_url,
      disableAnimations,
      preferredScale,
    });
    if (url) {
      urls.add(url);
    }
  }

  return Array.from(urls);
}

/**
 * Preload a batch of emotes in the background
 * @param emotes - Array of emotes to preload
 * @param limit - Max number of emotes to preload (default: 50)
 */
export async function preloadEmotes(
  emotes: SanitisedEmote[],
  limit = 50,
): Promise<void> {
  const toPreload: string[] = [];
  const seen = new Set<string>();

  // Keep copy-only variants out of the eager preload path. They remain on the
  // emote metadata for copy actions, but warming every static/animated scale
  // would multiply channel-entry network work. Warm only the 2x display URLs
  // that chat rows actually render.
  for (const emote of emotes) {
    const urls = getDisplayEmoteCacheUrls(emote);
    for (const url of urls) {
      if (toPreload.length >= limit) {
        break;
      }

      if (seen.has(url) || preloadedUrls.has(url)) {
        continue;
      }

      seen.add(url);
      toPreload.push(url);
    }

    if (toPreload.length >= limit) {
      break;
    }
  }

  if (toPreload.length === 0) {
    return;
  }

  // Preload in parallel batches of 10 to avoid overwhelming the network
  const BATCH_SIZE = 10;
  const batches: string[][] = [];
  for (let i = 0; i < toPreload.length; i += BATCH_SIZE) {
    batches.push(toPreload.slice(i, i + BATCH_SIZE));
  }
  for (const batch of batches) {
    // Sequential batches to avoid overwhelming the network. prefetch warms
    // expo-image's memory + disk cache, which is what the chat rows read.
    try {
      // eslint-disable-next-line react-doctor/async-await-in-loop -- batch preload is intentionally throttled
      await ExpoImage.prefetch(batch, 'memory-disk');
      batch.forEach(url => preloadedUrls.add(url));
    } catch {
      // Leave failed URLs out of preloadedUrls so a later attempt can retry them.
    }
  }

  // Prevent unbounded cache growth
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

  // Preload top 100 global emotes
  await preloadEmotes(allGlobal, 100);
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

  // Preload top 50 channel emotes
  await preloadEmotes(allChannel, 50);
}

/**
 * Clear preload cache (call on memory pressure or channel change)
 */
export function clearPreloadCache(): void {
  preloadedUrls.clear();
}
