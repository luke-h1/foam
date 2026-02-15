/**
 * Emote preloading utility using NitroImage
 *
 * Preloads emote images in the background to ensure instant display
 * when they appear in chat. Uses NitroImage's WebImages.preload() API.
 */
import type { SanitisedEmote } from '@app/types/emote';

// Lazy import to avoid loading nitro modules at app startup
type WebImagesType = { preload: (url: string) => void };
let WebImages: WebImagesType | null = null;

async function getWebImages(): Promise<WebImagesType> {
  if (!WebImages) {
    const module = await import('react-native-nitro-web-image');
    WebImages = module.WebImages as WebImagesType;
  }
  return WebImages;
}

// Track preloaded URLs to avoid duplicate preloads
const preloadedUrls = new Set<string>();
const MAX_PRELOADED_CACHE = 500;

/**
 * Preload a batch of emotes in the background
 * @param emotes - Array of emotes to preload
 * @param limit - Max number of emotes to preload (default: 50)
 */
export async function preloadEmotes(
  emotes: SanitisedEmote[],
  limit = 50,
): Promise<void> {
  const webImages = await getWebImages();

  // Filter out already preloaded URLs
  const toPreload = emotes
    .filter(emote => emote.url && !preloadedUrls.has(emote.url))
    .slice(0, limit);

  if (toPreload.length === 0) return;

  // Preload in parallel batches of 10 to avoid overwhelming the network
  const BATCH_SIZE = 10;
  const batches: SanitisedEmote[][] = [];
  for (let i = 0; i < toPreload.length; i += BATCH_SIZE) {
    batches.push(toPreload.slice(i, i + BATCH_SIZE));
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const batch of batches) {
    // Sequential batches to avoid overwhelming the network
    // eslint-disable-next-line no-await-in-loop
    await Promise.allSettled(
      batch.map(emote => {
        try {
          // preload is synchronous - it just queues the download
          webImages.preload(emote.url);
          preloadedUrls.add(emote.url);
          return Promise.resolve();
        } catch {
          // Silently ignore preload failures - emote will load on demand
          return Promise.resolve();
        }
      }),
    );
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
