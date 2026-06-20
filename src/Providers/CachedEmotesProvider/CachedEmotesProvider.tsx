import {
  createContext,
  PropsWithChildren,
  use,
  useEffect,
  useMemo,
} from 'react';
import { subscribeEmoteCacheMemoryPressure } from './cache-service';
import {
  CachedEmotesLoadingState,
  useCachedEmotes as useCachedEmotesData,
} from './useCachedEmotes';

type CachedEmotesDataType = {
  loadingState: CachedEmotesLoadingState;
  recalculateCachedEmotes: () => Promise<void>;
};

const CachedEmotesContext = createContext<CachedEmotesDataType | undefined>(
  undefined,
);

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
  const { loadingState, recalculateCachedEmotes } =
    useCachedEmotesData(channelId);

  useEffect(() => {
    subscribeEmoteCacheMemoryPressure();
  }, []);

  return (
    <CachedEmotesContext.Provider
      value={useMemo(
        () => ({ loadingState, recalculateCachedEmotes }),
        [loadingState, recalculateCachedEmotes],
      )}
    >
      {children}
    </CachedEmotesContext.Provider>
  );
};

export const useCachedEmotes = (): CachedEmotesDataType => {
  const context = use(CachedEmotesContext);

  if (context === undefined) {
    throw new Error(
      'useCachedEmotes must be used within a CachedEmotesProvider',
    );
  }

  return context;
};
