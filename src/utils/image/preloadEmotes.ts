import type { SanitisedEmote } from '@app/types/emote';
import { chunk } from '@app/utils/collection/chunk';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import {
  collectEmoteWarmUrls,
  orderEmotesForWarm,
} from '@app/utils/image/emoteWarmPlan';
import { prefetchToDisk } from '@app/utils/image/prefetchToDisk';
import { logger } from '@app/utils/logger';

const preloadedUrls = new Set<string>();
const MAX_PRELOADED_CACHE = 500;

/**
 * `prefetch` reports false-or-reject per batch, so both outcomes are reported
 * with the batch's shape rather than the urls themselves.
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

interface PreloadEmotesOptions {
  disableAnimations: boolean;
}

export async function preloadEmotes(
  emotes: SanitisedEmote[],
  { disableAnimations }: PreloadEmotesOptions,
): Promise<void> {
  // Warm only the display URL chat rows render; warming every copy-only
  // static/animated scale would multiply channel-entry network work.
  const toPreload = collectEmoteWarmUrls(emotes, {
    disableAnimations,
    accept: url => !preloadedUrls.has(url),
  });

  if (toPreload.length === 0) {
    return;
  }

  const BATCH_SIZE = 10;
  for (const batch of chunk(toPreload, BATCH_SIZE)) {
    // Sequential batches to avoid overwhelming the network. Failed URLs stay
    // out of preloadedUrls so a later attempt can retry them.
    try {
      // eslint-disable-next-line react-doctor/async-await-in-loop -- batch preload is intentionally throttled
      const warmed = await prefetchToDisk(batch);

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

interface GlobalEmoteData {
  twitchGlobalEmotes?: SanitisedEmote[];
  sevenTvGlobalEmotes?: SanitisedEmote[];
  bttvGlobalEmotes?: SanitisedEmote[];
  ffzGlobalEmotes?: SanitisedEmote[];
}

export async function preloadGlobalEmotes(
  emoteData: GlobalEmoteData,
  options: PreloadEmotesOptions,
): Promise<void> {
  await preloadEmotes(
    orderEmotesForWarm({
      sevenTv: emoteData.sevenTvGlobalEmotes,
      bttv: emoteData.bttvGlobalEmotes,
      ffz: emoteData.ffzGlobalEmotes,
      twitch: emoteData.twitchGlobalEmotes,
    }),
    options,
  );
}

interface ChannelEmoteData {
  twitchChannelEmotes?: SanitisedEmote[];
  sevenTvChannelEmotes?: SanitisedEmote[];
  bttvChannelEmotes?: SanitisedEmote[];
  ffzChannelEmotes?: SanitisedEmote[];
}

export async function preloadChannelEmotes(
  emoteData: ChannelEmoteData,
  options: PreloadEmotesOptions,
): Promise<void> {
  await preloadEmotes(
    orderEmotesForWarm({
      sevenTv: emoteData.sevenTvChannelEmotes,
      bttv: emoteData.bttvChannelEmotes,
      ffz: emoteData.ffzChannelEmotes,
      twitch: emoteData.twitchChannelEmotes,
    }),
    options,
  );
}
