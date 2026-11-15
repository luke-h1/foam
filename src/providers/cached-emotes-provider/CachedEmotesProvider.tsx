import { type PropsWithChildren, useEffect } from 'react';

import { subscribeEmoteCacheMemoryPressure } from '@app/lib/emote-cache/cacheService';

import { useCachedEmotes } from './use-cached-emotes';

export const CachedEmotesProvider = ({
  channelId,
  children,
}: PropsWithChildren<{ channelId: string }>) => {
  useCachedEmotes(channelId);

  useEffect(() => {
    subscribeEmoteCacheMemoryPressure();
  }, []);

  return children;
};
