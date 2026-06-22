import { useInfiniteQuery } from '@tanstack/react-query';

import { streamsByCategoryInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';

export function useStreamsByCategoryQuery(categoryId: string) {
  return useInfiniteQuery(streamsByCategoryInfiniteQueryOptions(categoryId));
}
