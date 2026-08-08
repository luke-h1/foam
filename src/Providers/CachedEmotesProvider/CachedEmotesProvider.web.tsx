import { PropsWithChildren } from 'react';

// Web has no decoded-ref fast path (useCachedEmote returns null on web and rows
// render the url directly), so the provider is a no-op passthrough.
export const CachedEmotesProvider = ({
  children,
}: PropsWithChildren<{ channelId: string }>) => children;
