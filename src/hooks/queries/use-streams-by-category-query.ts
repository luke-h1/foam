import { streamsByCategoryInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';
import { useInfiniteQuery } from '@tanstack/react-query';

export function useStreamsByCategoryQuery(categoryId: string) {
  return useInfiniteQuery(streamsByCategoryInfiniteQueryOptions(categoryId));
}
