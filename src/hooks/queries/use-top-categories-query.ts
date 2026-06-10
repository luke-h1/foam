import { topCategoriesInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';
import { useInfiniteQuery } from '@tanstack/react-query';

export function useTopCategoriesQuery() {
  return useInfiniteQuery({
    ...topCategoriesInfiniteQueryOptions(),
    refetchOnWindowFocus: true,
  });
}
