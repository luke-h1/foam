import { createContext, PropsWithChildren, use } from 'react';
import type { CachedEmotesLoadingState } from './useCachedEmotes';

type CachedEmotesDataType = {
  loadingState: CachedEmotesLoadingState;
  recalculateCachedEmotes: () => Promise<void>;
};

const CachedEmotesContext = createContext<CachedEmotesDataType | undefined>(
  undefined,
);

const WEB_VALUE: CachedEmotesDataType = {
  loadingState: 'IDLE',
  recalculateCachedEmotes: () => Promise.resolve(),
};

// Web has no decoded-ref fast path (useCachedEmote returns null on web and rows
// render the url directly), so the provider is a no-op passthrough.
export const CachedEmotesProvider = ({
  children,
}: PropsWithChildren<{ channelId: string }>) => (
  <CachedEmotesContext.Provider value={WEB_VALUE}>
    {children}
  </CachedEmotesContext.Provider>
);

export const useCachedEmotes = (): CachedEmotesDataType => {
  const context = use(CachedEmotesContext);
  if (context === undefined) {
    throw new Error(
      'useCachedEmotes must be used within a CachedEmotesProvider',
    );
  }
  return context;
};
