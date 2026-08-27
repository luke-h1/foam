import { PropsWithChildren, useEffect } from 'react';

import { subscribeEmoteCacheMemoryPressure } from './cache-service';
import { useCachedEmotes } from './useCachedEmotes';

/**
 * Owns the decode-once cache lifecycle for a channel: warms common emotes into
 * shared ImageRefs, releases on channel change; the long tail decodes lazily.
 */
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
