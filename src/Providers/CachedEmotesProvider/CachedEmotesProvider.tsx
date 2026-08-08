import { PropsWithChildren, useEffect } from 'react';

import { subscribeEmoteCacheMemoryPressure } from './cache-service';
import { useCachedEmotes } from './useCachedEmotes';

/**
 * Owns the decode-once {@link import('./cache-service')} lifecycle for a channel:
 * warms the channel's common emotes into shared, size-capped ImageRefs and
 * releases them when the channel changes. Consumers render individual emotes
 * via {@link import('./useCachedEmote').useCachedEmote}.
 *
 * Unlike swm-photos (which eagerly optimises every gallery photo), chat warms a
 * bounded common set up front and lets the long tail decode lazily on first use,
 * because chat only ever shows the emotes that appear in messages.
 */
export const CachedEmotesProvider = ({
  channelId,
  children,
}: PropsWithChildren<{ channelId: string }>) => {
  useCachedEmotes(channelId);

  useEffect(() => {
    subscribeEmoteCacheMemoryPressure();
  }, []);

  return <>{children}</>;
};
