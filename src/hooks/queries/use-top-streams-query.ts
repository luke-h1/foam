import { topStreamsInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';
import { useInfiniteQuery } from '@tanstack/react-query';

export function useTopStreamsQuery() {
  return useInfiniteQuery({
    ...topStreamsInfiniteQueryOptions(),
    refetchOnWindowFocus: true,
  });
}
