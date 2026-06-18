import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import type { SanitisedEmote } from '@app/types/emote';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { logger } from '@app/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { releaseChannelEmoteRefs, warmCachedEmoteRefs } from './cache-service';

export type CachedEmotesLoadingState = 'IDLE' | 'WARMING' | 'WARMED';

const WARM_BATCH_SIZE = 24;
const WARM_LIMIT = 96;
const GLOBAL_WARM_LIMIT = 128;

function collectDisplayUrls(emotes: SanitisedEmote[], limit: number): string[] {
  const urls = new Set<string>();
  for (const emote of emotes) {
    if (urls.size >= limit) {
      break;
    }
    const url = getDisplayEmoteUrl({
      image_variants: emote.image_variants,
      url: emote.url,
      static_url: emote.static_url,
      preferredScale: '2x',
    });
    if (url) {
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

export function useCachedEmotes(channelId: string) {
  const [loadingState, setLoadingState] =
    useState<CachedEmotesLoadingState>('IDLE');
  /**
   * Bumped whenever a new warm pass starts (channel change or recalc) so a
   * previous pass still resolving its awaits can detect it's stale and bail
   * instead of warming old URLs or overwriting the new channel's loading state.
   */
  const runIdRef = useRef(0);

  const warmInBatches = useCallback(
    async (urls: string[], pin: boolean, runId: number): Promise<boolean> => {
      for (let i = 0; i < urls.length; i += WARM_BATCH_SIZE) {
        // eslint-disable-next-line react-doctor/async-await-in-loop, react-doctor/async-defer-await -- batches are sequential and each must finish warming before we can tell whether this run was superseded
        await warmCachedEmoteRefs(urls.slice(i, i + WARM_BATCH_SIZE), { pin });
        if (runId !== runIdRef.current) {
          return false;
        }
      }
      return true;
    },
    [],
  );

  const calculate = useCallback(
    async (runId: number) => {
      const globalUrls = getGlobalDisplayUrls(channelId);
      const channelUrls = getChannelDisplayUrls(channelId);
      if (globalUrls.length === 0 && channelUrls.length === 0) {
        setLoadingState('WARMED');
        return;
      }
      setLoadingState('WARMING');
      if (!(await warmInBatches(globalUrls, true, runId))) {
        return;
      }
      if (!(await warmInBatches(channelUrls, false, runId))) {
        return;
      }
      setLoadingState('WARMED');
    },
    [channelId, warmInBatches],
  );

  const recalculateCachedEmotes = useCallback(async () => {
    logger.chat.debug('🔄 Recalculating cached emotes', { channelId });
    runIdRef.current += 1;
    const runId = runIdRef.current;
    releaseChannelEmoteRefs();
    await calculate(runId);
  }, [calculate, channelId]);

  useEffect(() => {
    runIdRef.current += 1;
    void calculate(runIdRef.current);
    return () => {
      runIdRef.current += 1;
      releaseChannelEmoteRefs();
      setLoadingState('IDLE');
    };
  }, [calculate]);

  return { loadingState, recalculateCachedEmotes };
}
