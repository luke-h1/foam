import { useEffect } from 'react';

import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import type { SanitisedEmote } from '@app/types/emote';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolveEmoteDisplayUrl';

import {
  abortInflightEmoteDecodes,
  releaseChannelEmoteRefs,
  warmCachedEmoteRefs,
} from './cache-service';

const WARM_BATCH_SIZE = 24;
/**
 * Static emotes to eagerly decode on channel entry; the warm storm starves
 * on-screen animated-emote decoding, so warm the common set only.
 */
const WARM_LIMIT = 64;
const GLOBAL_WARM_LIMIT = 64;

function collectDisplayUrls(emotes: SanitisedEmote[], limit: number): string[] {
  const urls = new Set<string>();
  for (const emote of emotes) {
    if (urls.size >= limit) {
      break;
    }
    const url = resolveEmoteDisplayUrl(emote);
    // Skip animated emotes: multi-frame decode is the entry storm; they warm on first paint.
    if (url && describeEmoteUrl(url).kind !== 'animated') {
      urls.add(url);
    }
  }
  return Array.from(urls);
}

function getGlobalDisplayUrls(channelId: string): string[] {
  const data = getCurrentEmoteData(channelId);
  return collectDisplayUrls(
    [
      ...data.sevenTvGlobalEmotes,
      ...data.bttvGlobalEmotes,
      ...data.ffzGlobalEmotes,
      ...data.twitchGlobalEmotes,
    ],
    GLOBAL_WARM_LIMIT,
  );
}

function getChannelDisplayUrls(channelId: string): string[] {
  const data = getCurrentEmoteData(channelId);
  return collectDisplayUrls(
    [
      ...data.sevenTvChannelEmotes,
      ...data.bttvChannelEmotes,
      ...data.ffzChannelEmotes,
      ...data.twitchChannelEmotes,
    ],
    WARM_LIMIT,
  );
}

async function warmInBatches(
  urls: string[],
  pin: boolean,
  isCancelled: () => boolean,
): Promise<void> {
  for (let i = 0; i < urls.length; i += WARM_BATCH_SIZE) {
    if (isCancelled()) {
      return;
    }
    // eslint-disable-next-line react-doctor/async-await-in-loop, react-doctor/async-defer-await -- batches are intentionally sequential so the warm storm stays bounded
    await warmCachedEmoteRefs(urls.slice(i, i + WARM_BATCH_SIZE), { pin });
  }
}

export function useCachedEmotes(channelId: string) {
  useEffect(() => {
    // On channel hop the cancel flag stops further batches and the decode fence drops the in-flight one; either would refill a cache nothing reads while holding decode slots.
    let cancelled = false;
    const isCancelled = () => cancelled;
    const warm = async () => {
      await warmInBatches(getGlobalDisplayUrls(channelId), true, isCancelled);
      await warmInBatches(getChannelDisplayUrls(channelId), false, isCancelled);
    };
    void warm();
    return () => {
      cancelled = true;
      abortInflightEmoteDecodes();
      releaseChannelEmoteRefs();
    };
  }, [channelId]);
}
