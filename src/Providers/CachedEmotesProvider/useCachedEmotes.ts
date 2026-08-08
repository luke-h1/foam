import { useEffect } from 'react';

import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import type { SanitisedEmote } from '@app/types/emote';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolveEmoteDisplayUrl';

import { releaseChannelEmoteRefs, warmCachedEmoteRefs } from './cache-service';

const WARM_BATCH_SIZE = 24;
/**
 * How many static emotes to eagerly decode into the shared ref cache on channel
 * entry. Decodes are capped at 8 concurrent, so these counts set the warm
 * storm's *duration*, and while it runs it starves the per-frame decoding of an
 * animated emote that's on screen (it plays choppy until the storm drains). Warm
 * the common set; the long tail decodes on-demand. Tune against the Chat Perf
 * harness.
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
  if (!data) {
    return [];
  }
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
  if (!data) {
    return [];
  }
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

async function warmInBatches(urls: string[], pin: boolean): Promise<void> {
  for (let i = 0; i < urls.length; i += WARM_BATCH_SIZE) {
    // eslint-disable-next-line react-doctor/async-await-in-loop, react-doctor/async-defer-await -- batches are intentionally sequential so the warm storm stays bounded
    await warmCachedEmoteRefs(urls.slice(i, i + WARM_BATCH_SIZE), { pin });
  }
}

export function useCachedEmotes(channelId: string) {
  useEffect(() => {
    const warm = async () => {
      await warmInBatches(getGlobalDisplayUrls(channelId), true);
      await warmInBatches(getChannelDisplayUrls(channelId), false);
    };
    void warm();
    return () => {
      releaseChannelEmoteRefs();
    };
  }, [channelId]);
}
