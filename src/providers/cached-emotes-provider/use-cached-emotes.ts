import { useEffect } from 'react';

import {
  abortInflightEmoteDecodes,
  releaseChannelEmoteRefs,
  warmCachedEmoteRefs,
} from '@app/lib/emote-cache/cacheService';
import { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import {
  type ChatResourceSliceKey,
  EMOTE_SLICE_KEYS,
  SLICE_BY_KEY,
  type SliceScope,
} from '@app/store/chat/types/chat-resource-slices';
import { usePreference } from '@app/store/preference-store';
import { chunk } from '@app/utils/collection/chunk';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import {
  collectEmoteWarmUrls,
  type EmoteWarmLists,
  orderEmotesForWarm,
} from '@app/utils/image/emoteWarmPlan';

const WARM_BATCH_SIZE = 24;

/**
 * Skip animated emotes: multi-frame decode is the entry storm; they warm on
 * first paint.
 */
const isStaticUrl = (url: string) => describeEmoteUrl(url).kind !== 'animated';

const WARM_LIST_BY_PROVIDER = {
  '7tv': 'sevenTv',
  bttv: 'bttv',
  ffz: 'ffz',
  twitch: 'twitch',
} as const satisfies Record<
  (typeof SLICE_BY_KEY)[ChatResourceSliceKey]['provider'],
  keyof EmoteWarmLists
>;

function getDisplayUrls(
  channelId: string,
  scope: SliceScope,
  disableAnimations: boolean,
): string[] {
  const data = getCurrentEmoteData(channelId);
  const lists: Required<EmoteWarmLists> = {
    sevenTv: [],
    bttv: [],
    ffz: [],
    twitch: [],
  };

  for (const key of EMOTE_SLICE_KEYS) {
    const slice = SLICE_BY_KEY[key];

    if (slice.scope === scope && key !== 'twitchSubscriberEmotes') {
      lists[WARM_LIST_BY_PROVIDER[slice.provider]] = data[key];
    }
  }

  return collectEmoteWarmUrls(orderEmotesForWarm(lists), {
    disableAnimations,
    accept: isStaticUrl,
  });
}

async function warmInBatches(
  urls: string[],
  pin: boolean,
  isCancelled: () => boolean,
): Promise<void> {
  for (const batch of chunk(urls, WARM_BATCH_SIZE)) {
    if (isCancelled()) {
      return;
    }

    // oxlint-disable-next-line react-doctor/async-await-in-loop -- batches are intentionally sequential so the warm storm stays bounded
    await warmCachedEmoteRefs(batch, { pin });
  }
}

export function useCachedEmotes(channelId: string) {
  const disableAnimations = usePreference('disableEmoteAnimations');

  useEffect(() => {
    // On channel hop the cancel flag stops further batches and the decode fence drops the in-flight one; either would refill a cache nothing reads while holding decode slots.
    let cancelled = false;

    const isCancelled = () => cancelled;

    const warm = async () => {
      await warmInBatches(
        getDisplayUrls(channelId, 'global', disableAnimations),
        true,
        isCancelled,
      );

      await warmInBatches(
        getDisplayUrls(channelId, 'channel', disableAnimations),
        false,
        isCancelled,
      );
    };

    void warm();

    return () => {
      cancelled = true;
      abortInflightEmoteDecodes();
      releaseChannelEmoteRefs();
    };
  }, [channelId, disableAnimations]);
}
