import { useInfiniteQuery } from '@tanstack/react-query';

import { topCategoriesInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';

export function useTopCategoriesQuery() {
  return useInfiniteQuery({
    ...topCategoriesInfiniteQueryOptions(),
    refetchOnWindowFocus: true,
  });
}
