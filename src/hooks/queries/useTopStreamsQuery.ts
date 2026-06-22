import { useInfiniteQuery } from '@tanstack/react-query';

import { topStreamsInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';

export function useTopStreamsQuery() {
  return useInfiniteQuery({
    ...topStreamsInfiniteQueryOptions(),
    refetchOnWindowFocus: true,
  });
}
