import type { PropsWithChildren } from 'react';

export const CachedEmotesProvider = ({
  children,
}: PropsWithChildren<{ channelId: string }>) => children;
