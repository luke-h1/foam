import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { logger } from '@app/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { clearCachedEmoteRefs, warmCachedEmoteRefs } from './cache-service';

export type CachedEmotesLoadingState = 'IDLE' | 'WARMING' | 'WARMED';

// Mirrors swm-photos' PROCESSING_BATCH_SIZE_LIMIT — warm in chunks so a channel
// with thousands of emotes can't block the JS thread in one pass.
const WARM_BATCH_SIZE = 24;
// Only the most common emotes are worth decoding up front; the long tail is
// warmed lazily by useCachedEmote as those emotes actually appear.
const WARM_LIMIT = 96;

function getChannelDisplayUrls(channelId: string): string[] {
  const data = getCurrentEmoteData(channelId);
  if (!data) {
    return [];
  }
  const emotes = [
    ...data.sevenTvChannelEmotes,
    ...data.bttvChannelEmotes,
    ...data.ffzChannelEmotes,
    ...data.twitchChannelEmotes,
  ];
  const urls = new Set<string>();
  for (const emote of emotes) {
    if (urls.size >= WARM_LIMIT) {
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

export function useCachedEmotes(channelId: string) {
  const [loadingState, setLoadingState] =
    useState<CachedEmotesLoadingState>('IDLE');

  const calculate = useCallback(async () => {
    const urls = getChannelDisplayUrls(channelId);
    if (urls.length === 0) {
      setLoadingState('WARMED');
      return;
    }
    setLoadingState('WARMING');
    for (let i = 0; i < urls.length; i += WARM_BATCH_SIZE) {
      // eslint-disable-next-line react-doctor/async-await-in-loop -- batches are intentionally sequential to avoid a decode spike on channel entry
      await warmCachedEmoteRefs(urls.slice(i, i + WARM_BATCH_SIZE));
    }
    setLoadingState('WARMED');
  }, [channelId]);

  const recalculateCachedEmotes = useCallback(async () => {
    logger.chat.debug('🔄 Recalculating cached emotes', { channelId });
    clearCachedEmoteRefs();
    await calculate();
  }, [calculate, channelId]);

  // Warm on channel change; release the previous channel's refs to bound memory.
  useEffect(() => {
    void calculate();
    return () => {
      clearCachedEmoteRefs();
      setLoadingState('IDLE');
    };
  }, [calculate]);

  return { loadingState, recalculateCachedEmotes };
}
